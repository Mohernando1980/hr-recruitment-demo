import uuid
from models import Session

_sessions: dict[str, Session] = {}


def create_session() -> Session:
    session_id = str(uuid.uuid4())
    session = Session(session_id=session_id)
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Session | None:
    return _sessions.get(session_id)


def save_session(session: Session) -> None:
    _sessions[session.session_id] = session
