from io import BytesIO

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

import agents
import state
from models import JobPosition, Message, Phase

app = FastAPI(title="HR AI Recruitment Demo")
app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Request bodies ───────────────────────────────────────────────────────────

class CVRequest(BaseModel):
    cv_text: str


class ChatRequest(BaseModel):
    message: str


# ── Root ─────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return FileResponse("static/index.html")


# ── Session lifecycle ─────────────────────────────────────────────────────────

@app.post("/api/session")
def create_session():
    session = state.create_session()
    return {"session_id": session.session_id}


@app.get("/api/session/{session_id}/status")
def session_status(session_id: str):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session.session_id,
        "phase": session.phase,
        "language": session.language,
        "job": session.job,
        "cv_result": session.cv_result,
        "initial_interview_complete": session.initial_interview.is_complete,
        "technical_interview_complete": session.technical_interview.is_complete,
        "has_report": session.report is not None,
    }


# ── Language update ───────────────────────────────────────────────────────────

@app.put("/api/session/{session_id}/language")
def set_language(session_id: str, lang: str = Query("en")):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.language = lang
    state.save_session(session)
    return {"language": lang}


# ── Job setup ─────────────────────────────────────────────────────────────────

@app.get("/api/session/{session_id}/example-job")
def example_job(session_id: str):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "title": "Senior Python Backend Engineer",
        "description": (
            "We are looking for a Senior Python Backend Engineer to join our platform team. "
            "You will design, build, and maintain high-performance REST APIs and microservices "
            "that power our core product. You will collaborate with frontend engineers, "
            "DevOps, and product managers to deliver reliable, scalable solutions."
        ),
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs"],
        "experience": "4+ years of professional backend development experience",
        "salary": "€70,000 - €90,000 per year",
    }


@app.post("/api/session/{session_id}/job")
def set_job(session_id: str, job: JobPosition, lang: str = Query("en")):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.job = job
    session.language = lang
    session.phase = Phase.CV_REVIEW
    state.save_session(session)
    return {"phase": session.phase}


# ── CV Screening ──────────────────────────────────────────────────────────────

@app.post("/api/session/{session_id}/cv")
def screen_cv(session_id: str, body: CVRequest):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.job:
        raise HTTPException(status_code=400, detail="Job not defined yet")
    if session.phase != Phase.CV_REVIEW:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")

    result = agents.screen_cv(session.job, body.cv_text, session.language)
    session.cv_text = body.cv_text
    session.cv_result = result

    if result.score < 50:
        session.phase = Phase.REPORT
    else:
        session.phase = Phase.INITIAL_INT

    state.save_session(session)
    return {"cv_result": result, "phase": session.phase}


# ── CV File Parser ────────────────────────────────────────────────────────────

@app.post("/api/session/{session_id}/cv/parse-file")
async def parse_cv_file(session_id: str, file: UploadFile = File(...)):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    content = await file.read()
    filename = file.filename or ""

    if filename.lower().endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse PDF: {e}")
    else:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    return {"text": text}


# ── Initial Interview ─────────────────────────────────────────────────────────

@app.get("/api/session/{session_id}/initial-interview/start")
def start_initial_interview(session_id: str):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.INITIAL_INT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")

    system = agents._build_initial_interview_system(session.job, session.language)
    first_message, _ = agents.start_interview(system)

    session.initial_interview.messages = [Message(role="assistant", content=first_message)]
    state.save_session(session)
    return {"message": first_message, "is_complete": False}


@app.post("/api/session/{session_id}/initial-interview/message")
def initial_interview_message(session_id: str, body: ChatRequest):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.INITIAL_INT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")
    if session.initial_interview.is_complete:
        raise HTTPException(status_code=400, detail="Interview already complete")

    system = agents._build_initial_interview_system(session.job, session.language)
    history = session.initial_interview.messages

    reply, is_complete = agents.interview_turn(system, history, body.message)

    session.initial_interview.messages.append(Message(role="user", content=body.message))
    session.initial_interview.messages.append(Message(role="assistant", content=reply))
    session.initial_interview.is_complete = is_complete

    if is_complete:
        summary = agents.summarize_interview(
            session.initial_interview,
            f"Initial HR screening for {session.job.title}",
            session.language,
        )
        session.initial_interview.summary = summary
        session.phase = Phase.TECH_INT

    state.save_session(session)
    return {"message": reply, "is_complete": is_complete, "phase": session.phase}


@app.post("/api/session/{session_id}/initial-interview/end")
def end_initial_interview(session_id: str):
    """Force-complete the HR interview (demo shortcut)."""
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.INITIAL_INT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")

    session.initial_interview.is_complete = True
    if session.initial_interview.messages:
        session.initial_interview.summary = agents.summarize_interview(
            session.initial_interview,
            f"Initial HR screening for {session.job.title}",
            session.language,
        )
    else:
        session.initial_interview.summary = "Interview ended early."
    session.phase = Phase.TECH_INT
    state.save_session(session)
    return {"phase": session.phase}


# ── Technical Interview ───────────────────────────────────────────────────────

@app.get("/api/session/{session_id}/technical-interview/start")
def start_technical_interview(session_id: str):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.TECH_INT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")

    cv_summary = (
        f"Score: {session.cv_result.score}/100. "
        f"Strengths: {', '.join(session.cv_result.strengths)}. "
        f"Gaps: {', '.join(session.cv_result.gaps)}."
    )
    hr_summary = session.initial_interview.summary or "No HR summary available."
    system = agents._build_technical_interview_system(
        session.job, cv_summary, hr_summary, session.language
    )
    first_message, _ = agents.start_interview(system)

    session.technical_interview.messages = [Message(role="assistant", content=first_message)]
    state.save_session(session)
    return {"message": first_message, "is_complete": False}


@app.post("/api/session/{session_id}/technical-interview/message")
def technical_interview_message(session_id: str, body: ChatRequest):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.TECH_INT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")
    if session.technical_interview.is_complete:
        raise HTTPException(status_code=400, detail="Interview already complete")

    cv_summary = (
        f"Score: {session.cv_result.score}/100. "
        f"Strengths: {', '.join(session.cv_result.strengths)}. "
        f"Gaps: {', '.join(session.cv_result.gaps)}."
    )
    hr_summary = session.initial_interview.summary or "No HR summary available."
    system = agents._build_technical_interview_system(
        session.job, cv_summary, hr_summary, session.language
    )
    history = session.technical_interview.messages

    reply, is_complete = agents.interview_turn(system, history, body.message)

    session.technical_interview.messages.append(Message(role="user", content=body.message))
    session.technical_interview.messages.append(Message(role="assistant", content=reply))
    session.technical_interview.is_complete = is_complete

    if is_complete:
        summary = agents.summarize_interview(
            session.technical_interview,
            f"Technical interview for {session.job.title}",
            session.language,
        )
        session.technical_interview.summary = summary
        session.phase = Phase.REPORT

    state.save_session(session)
    return {"message": reply, "is_complete": is_complete, "phase": session.phase}


@app.post("/api/session/{session_id}/technical-interview/end")
def end_technical_interview(session_id: str):
    """Force-complete the technical interview (demo shortcut)."""
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.TECH_INT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")

    session.technical_interview.is_complete = True
    if session.technical_interview.messages:
        session.technical_interview.summary = agents.summarize_interview(
            session.technical_interview,
            f"Technical interview for {session.job.title}",
            session.language,
        )
    else:
        session.technical_interview.summary = "Interview ended early."
    session.phase = Phase.REPORT
    state.save_session(session)
    return {"phase": session.phase}


# ── Final Report ──────────────────────────────────────────────────────────────

@app.get("/api/session/{session_id}/report")
def get_report(session_id: str):
    session = state.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.phase != Phase.REPORT:
        raise HTTPException(status_code=400, detail=f"Wrong phase: {session.phase}")

    if session.report is None:
        report = agents.generate_report(
            session.job, session.cv_result,
            session.initial_interview, session.technical_interview,
            session.language,
        )
        session.report = report
        state.save_session(session)

    return session.report
