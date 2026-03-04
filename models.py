from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Phase(str, Enum):
    SETUP = "setup"
    CV_REVIEW = "cv_review"
    INITIAL_INT = "initial_interview"
    TECH_INT = "technical_interview"
    REPORT = "report"


class JobPosition(BaseModel):
    title: str
    description: str
    skills: list[str]
    experience: str
    salary: str


class CVScreeningResult(BaseModel):
    score: int = Field(ge=0, le=100)
    strengths: list[str]
    gaps: list[str]
    recommendation: str


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class InterviewState(BaseModel):
    messages: list[Message] = []
    is_complete: bool = False
    summary: Optional[str] = None


class FinalReport(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    cv_score: int
    initial_interview_score: int
    technical_interview_score: int
    recommendation: str
    strengths: list[str]
    concerns: list[str]
    next_steps: list[str]


class Session(BaseModel):
    session_id: str
    phase: Phase = Phase.SETUP
    language: str = "en"   # "en" | "es"
    job: Optional[JobPosition] = None
    cv_text: Optional[str] = None
    cv_result: Optional[CVScreeningResult] = None
    initial_interview: InterviewState = InterviewState()
    technical_interview: InterviewState = InterviewState()
    report: Optional[FinalReport] = None
