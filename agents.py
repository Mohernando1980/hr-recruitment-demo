import json
import os
import re
import time

from google import genai
from google.genai import types, errors

from models import JobPosition, CVScreeningResult, Message, FinalReport, InterviewState

_api_key = os.environ.get("GEMINI_API_KEY", "")
if not _api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")
_client = genai.Client(api_key=_api_key)

MODEL = "gemini-2.5-flash"

COMPLETE_TOKEN = "[INTERVIEW_COMPLETE]"
MESSAGE_CAP = 20
WRAP_UP_INSTRUCTION = (
    "\n\n[System: You have reached the maximum number of exchanges. "
    "Please wrap up the interview now, thank the candidate, and end with "
    + COMPLETE_TOKEN
    + "]"
)


def _strip_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _lang_instruction(language: str) -> str:
    if language == "es":
        return "\n\nIMPORTANT: You must conduct this entire interaction in Spanish (español). All your responses must be in Spanish."
    return ""


def _parse_json_response(text: str) -> dict:
    try:
        return json.loads(_strip_fences(text))
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON: {e}\nRaw: {text[:500]}")


def _generate_with_retry(model: str, config, contents, max_retries: int = 5) -> str:
    """Call generate_content with exponential backoff on 429 rate-limit errors."""
    delay = 20
    for attempt in range(max_retries):
        try:
            response = _client.models.generate_content(
                model=model, config=config, contents=contents
            )
            return response.text
        except errors.ClientError as e:
            if e.code == 429 and attempt < max_retries - 1:
                print(f"Rate limited, retrying in {delay}s... (attempt {attempt+1})")
                time.sleep(delay)
                delay = min(delay * 2, 120)
            else:
                raise


def _single_shot(system: str, user: str) -> str:
    return _generate_with_retry(
        MODEL,
        types.GenerateContentConfig(system_instruction=system),
        user,
    )


def _to_genai_contents(messages: list[Message]) -> list[types.Content]:
    """Convert our Message list to google-genai Content objects."""
    result = []
    for msg in messages:
        role = "model" if msg.role == "assistant" else "user"
        result.append(types.Content(role=role, parts=[types.Part(text=msg.content)]))
    return result


# ── CV Screening ─────────────────────────────────────────────────────────────

def screen_cv(job: JobPosition, cv_text: str, language: str = "en") -> CVScreeningResult:
    system = (
        "You are an expert HR recruiter. Analyze the candidate's CV against the job requirements "
        "and respond ONLY with a JSON object matching this schema exactly:\n"
        "{\n"
        '  "score": <integer 0-100>,\n'
        '  "strengths": [<string>, ...],\n'
        '  "gaps": [<string>, ...],\n'
        '  "recommendation": <string>\n'
        "}\n"
        "No markdown, no explanation outside the JSON."
        + _lang_instruction(language)
    )
    user_content = (
        f"Job Position: {job.title}\n"
        f"Description: {job.description}\n"
        f"Required Skills: {', '.join(job.skills)}\n"
        f"Experience Required: {job.experience}\n"
        f"Salary: {job.salary}\n\n"
        f"Candidate CV:\n{cv_text}"
    )
    raw = _single_shot(system, user_content)
    data = _parse_json_response(raw)
    return CVScreeningResult(**data)


# ── Interview system prompts ──────────────────────────────────────────────────

def _build_initial_interview_system(job: JobPosition, language: str = "en") -> str:
    return (
        f"You are a friendly but professional HR interviewer at a tech company conducting an "
        f"initial screening interview for the role of {job.title}.\n\n"
        f"Job Details:\n"
        f"- Description: {job.description}\n"
        f"- Required Skills: {', '.join(job.skills)}\n"
        f"- Experience: {job.experience}\n"
        f"- Salary: {job.salary}\n\n"
        "Your goals:\n"
        "1. Introduce yourself and the role briefly.\n"
        "2. Ask about the candidate's background and motivation.\n"
        "3. Explore cultural fit and communication skills.\n"
        "4. Cover salary expectations and availability.\n"
        "5. Answer any questions the candidate has.\n\n"
        "Keep responses concise (2-4 sentences per turn). Ask one question at a time. "
        "After 5-8 exchanges when you have enough information, conclude the interview professionally "
        f"and append exactly '{COMPLETE_TOKEN}' at the end of your final message."
        + _lang_instruction(language)
    )


def _build_technical_interview_system(job: JobPosition, cv_summary: str, hr_summary: str, language: str = "en") -> str:
    return (
        f"You are a senior software engineer conducting a technical interview for {job.title}.\n\n"
        f"Candidate Background (from CV screening):\n{cv_summary}\n\n"
        f"HR Interview Summary:\n{hr_summary}\n\n"
        f"Required Skills to assess: {', '.join(job.skills)}\n\n"
        "Your goals:\n"
        "1. Assess technical depth in the required skills.\n"
        "2. Ask practical scenario-based questions.\n"
        "3. Probe problem-solving approach and system design thinking.\n"
        "4. Cover at least 3 different technical areas.\n\n"
        "Keep responses concise. Ask one question at a time. "
        "After 6-10 exchanges when you have covered the technical areas, conclude professionally "
        f"and append exactly '{COMPLETE_TOKEN}' at the end of your final message."
        + _lang_instruction(language)
    )


# ── Multi-turn interview ──────────────────────────────────────────────────────

def interview_turn(
    system: str,
    history: list[Message],
    user_message: str,
) -> tuple[str, bool]:
    """One turn of a multi-turn interview. Returns (reply, is_complete)."""
    extra = WRAP_UP_INSTRUCTION if len(history) >= MESSAGE_CAP else ""
    full_user_message = user_message + extra

    contents = _to_genai_contents(history) + [
        types.Content(role="user", parts=[types.Part(text=full_user_message)])
    ]

    raw_reply = _generate_with_retry(
        MODEL,
        types.GenerateContentConfig(system_instruction=system),
        contents,
    )
    is_complete = COMPLETE_TOKEN in raw_reply
    clean_reply = raw_reply.replace(COMPLETE_TOKEN, "").strip()
    return clean_reply, is_complete


def start_interview(system: str) -> tuple[str, list[Message]]:
    """Bootstrap with a sentinel prompt. Returns (first_message, empty_history)."""
    first_message = _generate_with_retry(
        MODEL,
        types.GenerateContentConfig(system_instruction=system),
        "Please begin the interview.",
    ).replace(COMPLETE_TOKEN, "").strip()
    return first_message, []


# ── Summary & Report ──────────────────────────────────────────────────────────

def summarize_interview(interview: InterviewState, role_context: str, language: str = "en") -> str:
    transcript = "\n".join(
        f"{msg.role.upper()}: {msg.content}" for msg in interview.messages
    )
    system = (
        "You are an HR analyst. Summarize the following interview transcript in 3-5 bullet points. "
        "Focus on key observations, candidate strengths, and any concerns. Be concise."
        + _lang_instruction(language)
    )
    return _single_shot(system, f"Interview context: {role_context}\n\nTranscript:\n{transcript}")


def generate_report(
    job: JobPosition,
    cv_result: CVScreeningResult,
    initial_interview: InterviewState,
    technical_interview: InterviewState,
    language: str = "en",
) -> FinalReport:
    system = (
        "You are a senior HR manager writing a final candidate assessment. "
        "Respond ONLY with a JSON object matching this schema exactly:\n"
        "{\n"
        '  "overall_score": <integer 0-100>,\n'
        '  "cv_score": <integer 0-100>,\n'
        '  "initial_interview_score": <integer 0-100>,\n'
        '  "technical_interview_score": <integer 0-100>,\n'
        '  "recommendation": <"Strong Hire" | "Hire" | "Consider" | "No Hire">,\n'
        '  "strengths": [<string>, ...],\n'
        '  "concerns": [<string>, ...],\n'
        '  "next_steps": [<string>, ...]\n'
        "}\n"
        "No markdown, no explanation outside the JSON."
        + _lang_instruction(language)
    )
    cv_summary = (
        f"Score: {cv_result.score}/100\n"
        f"Strengths: {', '.join(cv_result.strengths)}\n"
        f"Gaps: {', '.join(cv_result.gaps)}\n"
        f"Recommendation: {cv_result.recommendation}"
    )
    user_content = (
        f"Position: {job.title}\n"
        f"Required Skills: {', '.join(job.skills)}\n"
        f"Experience Required: {job.experience}\n\n"
        f"CV Screening:\n{cv_summary}\n\n"
        f"Initial HR Interview Summary:\n{initial_interview.summary or 'No summary.'}\n\n"
        f"Technical Interview Summary:\n{technical_interview.summary or 'No summary.'}"
    )
    raw = _single_shot(system, user_content)
    data = _parse_json_response(raw)
    return FinalReport(**data)
