from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from typing import Any

from sqlalchemy import select

from app.core.config import get_settings, is_production
from app.db import Base, SessionLocal, engine
from app.models.db_models import FindingModel, LogModel, OAuthSessionModel, ReviewJobModel, UserAIKeyModel
from app.models.schemas import Finding, LogEvent, ReviewJob


class SQLAlchemyStorage:
    def __init__(self) -> None:
        if engine is None or SessionLocal is None:
            raise RuntimeError("DATABASE_URL is required for SQLAlchemy storage.")
        if not is_production():
            Base.metadata.create_all(bind=engine)

    @contextmanager
    def session(self):
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def create_job(self, job_id: str, owner: str, repo: str, pr_number: int) -> None:
        with self.session() as db:
            db.add(
                ReviewJobModel(
                    id=job_id,
                    status="queued",
                    owner=owner,
                    repo=repo,
                    pr_number=pr_number,
                    created_at=datetime.utcnow(),
                )
            )

    def update_job_status(self, job_id: str, status: str) -> None:
        with self.session() as db:
            job = db.get(ReviewJobModel, job_id)
            if not job:
                return
            job.status = status
            if status in {"completed", "failed"} and not job.completed_at:
                job.completed_at = datetime.utcnow()

    def get_job(self, job_id: str) -> ReviewJob | None:
        with self.session() as db:
            job = db.get(ReviewJobModel, job_id)
            if not job:
                return None
            return ReviewJob(
                id=job.id,
                status=job.status,
                owner=job.owner,
                repo=job.repo,
                pr_number=job.pr_number,
                created_at=job.created_at,
                completed_at=job.completed_at,
            )

    def add_log(self, event: LogEvent) -> None:
        with self.session() as db:
            db.add(
                LogModel(
                    job_id=event.job_id,
                    type=event.type,
                    agent=event.agent,
                    message=event.message,
                    metadata_json=event.metadata,
                    created_at=event.created_at,
                )
            )

    def list_logs(self, job_id: str, after_id: int = 0) -> list[LogEvent]:
        with self.session() as db:
            rows = db.scalars(
                select(LogModel)
                .where(LogModel.job_id == job_id, LogModel.id > after_id)
                .order_by(LogModel.id.asc())
            ).all()
            return [
                LogEvent(
                    id=row.id,
                    job_id=row.job_id,
                    type=row.type,
                    agent=row.agent,
                    message=row.message,
                    metadata=row.metadata_json or {},
                    created_at=row.created_at,
                )
                for row in rows
            ]

    def save_findings(self, job_id: str, findings: list[Finding]) -> None:
        with self.session() as db:
            for finding in findings:
                row = db.get(FindingModel, finding.id)
                if not row:
                    row = FindingModel(id=finding.id, job_id=job_id)
                    db.add(row)
                row.job_id = job_id
                row.agent = finding.agent
                row.file_path = finding.file_path
                row.line_number = finding.line_number
                row.severity = finding.severity
                row.title = finding.title
                row.explanation = finding.explanation
                row.suggestion = finding.suggestion
                row.code_snippet = finding.code_snippet
                row.approved = finding.approved
                row.posted = finding.posted
                row.status = finding.status

    def list_findings(self, job_id: str) -> list[Finding]:
        with self.session() as db:
            rows = db.scalars(select(FindingModel).where(FindingModel.job_id == job_id).order_by(FindingModel.id.asc())).all()
            return [self._finding_from_row(row) for row in rows]

    def get_finding(self, finding_id: str) -> Finding | None:
        with self.session() as db:
            row = db.get(FindingModel, finding_id)
            return self._finding_from_row(row) if row else None

    def update_finding_flags(self, finding_id: str, **flags: Any) -> None:
        if "posted" in flags and flags["posted"]:
            flags["status"] = "posted"
            flags["approved"] = True
        elif "approved" in flags:
            flags["status"] = "approved" if flags["approved"] else "pending"
        with self.session() as db:
            row = db.get(FindingModel, finding_id)
            if not row:
                return
            for key in {"approved", "posted", "status"}:
                if key in flags:
                    setattr(row, key, flags[key])

    def update_finding_status(self, finding_id: str, status: str) -> None:
        if status not in {"approved", "rejected", "posted", "pending"}:
            raise ValueError("Invalid finding status")
        with self.session() as db:
            row = db.get(FindingModel, finding_id)
            if not row:
                return
            row.status = status
            row.approved = status in {"approved", "posted"}
            row.posted = status == "posted"

    def save_oauth_session(self, session: dict[str, Any]) -> None:
        now = datetime.utcnow()
        with self.session() as db:
            row = db.get(OAuthSessionModel, session["session_id"])
            if not row:
                row = OAuthSessionModel(session_id=session["session_id"], created_at=now)
                db.add(row)
            row.github_user_id = session["github_user_id"]
            row.login = session["login"]
            row.name = session.get("name")
            row.avatar_url = session.get("avatar_url")
            row.html_url = session.get("html_url")
            row.encrypted_token = session["encrypted_token"]
            row.updated_at = now

    def get_oauth_session(self, session_id: str | None) -> dict[str, Any] | None:
        if not session_id:
            return None
        with self.session() as db:
            row = db.get(OAuthSessionModel, session_id)
            if not row:
                return None
            return {
                "session_id": row.session_id,
                "github_user_id": row.github_user_id,
                "login": row.login,
                "name": row.name,
                "avatar_url": row.avatar_url,
                "html_url": row.html_url,
                "encrypted_token": row.encrypted_token,
                "created_at": row.created_at.isoformat(),
                "updated_at": row.updated_at.isoformat(),
            }

    def delete_oauth_session(self, session_id: str | None) -> None:
        if not session_id:
            return
        with self.session() as db:
            row = db.get(OAuthSessionModel, session_id)
            if row:
                db.delete(row)

    def upsert_user_ai_key(self, user_id: str, provider: str, encrypted_key: str, masked_key: str, default_model: str) -> None:
        now = datetime.utcnow()
        with self.session() as db:
            row = db.scalar(select(UserAIKeyModel).where(UserAIKeyModel.user_id == user_id, UserAIKeyModel.provider == provider))
            if not row:
                row = UserAIKeyModel(user_id=user_id, provider=provider, created_at=now)
                db.add(row)
            row.encrypted_key = encrypted_key
            row.masked_key = masked_key
            row.default_model = default_model
            row.updated_at = now

    def list_user_ai_keys(self, user_id: str) -> list[dict[str, Any]]:
        with self.session() as db:
            rows = db.scalars(select(UserAIKeyModel).where(UserAIKeyModel.user_id == user_id).order_by(UserAIKeyModel.provider.asc())).all()
            return [
                {
                    "provider": row.provider,
                    "masked_key": row.masked_key,
                    "default_model": row.default_model,
                    "updated_at": row.updated_at.isoformat(),
                }
                for row in rows
            ]

    def get_user_ai_key(self, user_id: str, provider: str) -> dict[str, Any] | None:
        with self.session() as db:
            row = db.scalar(select(UserAIKeyModel).where(UserAIKeyModel.user_id == user_id, UserAIKeyModel.provider == provider))
            return self._user_ai_key_dict(row) if row else None

    def get_any_user_ai_key(self, user_id: str) -> dict[str, Any] | None:
        with self.session() as db:
            row = db.scalar(select(UserAIKeyModel).where(UserAIKeyModel.user_id == user_id).order_by(UserAIKeyModel.updated_at.desc()))
            return self._user_ai_key_dict(row) if row else None

    def delete_user_ai_key(self, user_id: str, provider: str) -> None:
        with self.session() as db:
            row = db.scalar(select(UserAIKeyModel).where(UserAIKeyModel.user_id == user_id, UserAIKeyModel.provider == provider))
            if row:
                db.delete(row)

    @staticmethod
    def _finding_from_row(row: FindingModel) -> Finding:
        return Finding(
            id=row.id,
            agent=row.agent,
            file_path=row.file_path,
            line_number=row.line_number,
            severity=row.severity,
            title=row.title,
            explanation=row.explanation,
            suggestion=row.suggestion,
            code_snippet=row.code_snippet,
            approved=row.approved,
            posted=row.posted,
            status=row.status,
        )

    @staticmethod
    def _user_ai_key_dict(row: UserAIKeyModel) -> dict[str, Any]:
        return {
            "id": row.id,
            "user_id": row.user_id,
            "provider": row.provider,
            "encrypted_key": row.encrypted_key,
            "masked_key": row.masked_key,
            "default_model": row.default_model,
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
        }
