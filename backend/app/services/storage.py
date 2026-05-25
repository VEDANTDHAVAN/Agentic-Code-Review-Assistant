from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.models.schemas import Finding, LogEvent, ReviewJob


BACKEND_DIR = Path(__file__).resolve().parents[2]


def resolve_database_path(raw_path: str) -> Path:
    path = Path(raw_path)
    clean_parts = [part for part in path.parts if part not in {path.anchor, path.drive, "\\", "/"}]
    if path.is_absolute() or path.anchor:
        if clean_parts and clean_parts[0] == "backend":
            return BACKEND_DIR.joinpath(*clean_parts[1:])
        if clean_parts and clean_parts[0] == "data":
            return BACKEND_DIR.joinpath(*clean_parts)
        return path
    return BACKEND_DIR / path


class Storage:
    def __init__(self) -> None:
        self.db_path = resolve_database_path(get_settings().database_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    @contextmanager
    def connect(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_db(self) -> None:
        with self.connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS review_jobs (
                  id TEXT PRIMARY KEY,
                  status TEXT NOT NULL,
                  owner TEXT NOT NULL,
                  repo TEXT NOT NULL,
                  pr_number INTEGER NOT NULL,
                  created_at TEXT NOT NULL,
                  completed_at TEXT
                );
                CREATE TABLE IF NOT EXISTS findings (
                  id TEXT PRIMARY KEY,
                  job_id TEXT NOT NULL,
                  agent TEXT NOT NULL,
                  file_path TEXT,
                  line_number INTEGER,
                  severity TEXT NOT NULL,
                  title TEXT NOT NULL,
                  explanation TEXT NOT NULL,
                  suggestion TEXT NOT NULL,
                  code_snippet TEXT,
                  approved INTEGER NOT NULL DEFAULT 0,
                  posted INTEGER NOT NULL DEFAULT 0,
                  status TEXT NOT NULL DEFAULT 'pending',
                  FOREIGN KEY(job_id) REFERENCES review_jobs(id)
                );
                CREATE TABLE IF NOT EXISTS logs (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  job_id TEXT NOT NULL,
                  type TEXT NOT NULL,
                  agent TEXT,
                  message TEXT NOT NULL,
                  metadata TEXT NOT NULL DEFAULT '{}',
                  created_at TEXT NOT NULL,
                  FOREIGN KEY(job_id) REFERENCES review_jobs(id)
                );
                CREATE TABLE IF NOT EXISTS oauth_sessions (
                  session_id TEXT PRIMARY KEY,
                  github_user_id INTEGER NOT NULL,
                  login TEXT NOT NULL,
                  name TEXT,
                  avatar_url TEXT,
                  html_url TEXT,
                  encrypted_token TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS user_ai_keys (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id TEXT NOT NULL,
                  provider TEXT NOT NULL,
                  encrypted_key TEXT NOT NULL,
                  masked_key TEXT NOT NULL,
                  default_model TEXT NOT NULL,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  UNIQUE(user_id, provider)
                );
                """
            )
            columns = {row["name"] for row in conn.execute("PRAGMA table_info(findings)").fetchall()}
            if "status" not in columns:
                conn.execute("ALTER TABLE findings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'")
            conn.execute("UPDATE findings SET status = 'posted' WHERE posted = 1")
            conn.execute("UPDATE findings SET status = 'approved' WHERE posted = 0 AND approved = 1")

    def create_job(self, job_id: str, owner: str, repo: str, pr_number: int) -> None:
        with self.connect() as conn:
            conn.execute(
                "INSERT INTO review_jobs VALUES (?, ?, ?, ?, ?, ?, ?)",
                (job_id, "queued", owner, repo, pr_number, datetime.utcnow().isoformat(), None),
            )

    def update_job_status(self, job_id: str, status: str) -> None:
        completed_at = datetime.utcnow().isoformat() if status in {"completed", "failed"} else None
        with self.connect() as conn:
            conn.execute(
                "UPDATE review_jobs SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?",
                (status, completed_at, job_id),
            )

    def get_job(self, job_id: str) -> ReviewJob | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM review_jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            return None
        return ReviewJob(
            id=row["id"],
            status=row["status"],
            owner=row["owner"],
            repo=row["repo"],
            pr_number=row["pr_number"],
            created_at=datetime.fromisoformat(row["created_at"]),
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
        )

    def add_log(self, event: LogEvent) -> None:
        with self.connect() as conn:
            conn.execute(
                "INSERT INTO logs (job_id, type, agent, message, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    event.job_id,
                    event.type,
                    event.agent,
                    event.message,
                    json.dumps(event.metadata),
                    event.created_at.isoformat(),
                ),
            )

    def list_logs(self, job_id: str, after_id: int = 0) -> list[LogEvent]:
        with self.connect() as conn:
            rows = conn.execute(
                "SELECT * FROM logs WHERE job_id = ? AND id > ? ORDER BY id ASC",
                (job_id, after_id),
            ).fetchall()
        return [
            LogEvent(
                id=row["id"],
                job_id=row["job_id"],
                type=row["type"],
                agent=row["agent"],
                message=row["message"],
                metadata=json.loads(row["metadata"] or "{}"),
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in rows
        ]

    def save_findings(self, job_id: str, findings: list[Finding]) -> None:
        with self.connect() as conn:
            for finding in findings:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO findings
                    (id, job_id, agent, file_path, line_number, severity, title, explanation, suggestion, code_snippet, approved, posted, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        finding.id,
                        job_id,
                        finding.agent,
                        finding.file_path,
                        finding.line_number,
                        finding.severity,
                        finding.title,
                        finding.explanation,
                        finding.suggestion,
                        finding.code_snippet,
                        int(finding.approved),
                        int(finding.posted),
                        finding.status,
                    ),
                )

    def list_findings(self, job_id: str) -> list[Finding]:
        with self.connect() as conn:
            rows = conn.execute("SELECT * FROM findings WHERE job_id = ? ORDER BY severity DESC, id ASC", (job_id,)).fetchall()
        return [
            Finding(
                id=row["id"],
                agent=row["agent"],
                file_path=row["file_path"],
                line_number=row["line_number"],
                severity=row["severity"],
                title=row["title"],
                explanation=row["explanation"],
                suggestion=row["suggestion"],
                code_snippet=row["code_snippet"],
                approved=bool(row["approved"]),
                posted=bool(row["posted"]),
                status=row["status"],
            )
            for row in rows
        ]

    def get_finding(self, finding_id: str) -> Finding | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM findings WHERE id = ?", (finding_id,)).fetchone()
        if not row:
            return None
        return Finding(
            id=row["id"],
            agent=row["agent"],
            file_path=row["file_path"],
            line_number=row["line_number"],
            severity=row["severity"],
            title=row["title"],
            explanation=row["explanation"],
            suggestion=row["suggestion"],
            code_snippet=row["code_snippet"],
            approved=bool(row["approved"]),
            posted=bool(row["posted"]),
            status=row["status"],
        )

    def update_finding_flags(self, finding_id: str, **flags: Any) -> None:
        if "posted" in flags and flags["posted"]:
            flags["status"] = "posted"
            flags["approved"] = True
        elif "approved" in flags:
            flags["status"] = "approved" if flags["approved"] else "pending"
        allowed = {"approved", "posted", "status"}
        updates = [(key, value if key == "status" else int(value)) for key, value in flags.items() if key in allowed]
        if not updates:
            return
        clause = ", ".join(f"{key} = ?" for key, _ in updates)
        values = [value for _, value in updates] + [finding_id]
        with self.connect() as conn:
            conn.execute(f"UPDATE findings SET {clause} WHERE id = ?", values)

    def update_finding_status(self, finding_id: str, status: str) -> None:
        if status not in {"approved", "rejected", "posted", "pending"}:
            raise ValueError("Invalid finding status")
        approved = status in {"approved", "posted"}
        posted = status == "posted"
        with self.connect() as conn:
            conn.execute(
                "UPDATE findings SET status = ?, approved = ?, posted = ? WHERE id = ?",
                (status, int(approved), int(posted), finding_id),
            )

    def save_oauth_session(self, session: dict[str, Any]) -> None:
        now = datetime.utcnow().isoformat()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO oauth_sessions
                (session_id, github_user_id, login, name, avatar_url, html_url, encrypted_token, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM oauth_sessions WHERE session_id = ?), ?), ?)
                """,
                (
                    session["session_id"],
                    session["github_user_id"],
                    session["login"],
                    session.get("name"),
                    session.get("avatar_url"),
                    session.get("html_url"),
                    session["encrypted_token"],
                    session["session_id"],
                    now,
                    now,
                ),
            )

    def get_oauth_session(self, session_id: str | None) -> dict[str, Any] | None:
        if not session_id:
            return None
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM oauth_sessions WHERE session_id = ?", (session_id,)).fetchone()
        return dict(row) if row else None

    def delete_oauth_session(self, session_id: str | None) -> None:
        if not session_id:
            return
        with self.connect() as conn:
            conn.execute("DELETE FROM oauth_sessions WHERE session_id = ?", (session_id,))

    def upsert_user_ai_key(self, user_id: str, provider: str, encrypted_key: str, masked_key: str, default_model: str) -> None:
        now = datetime.now().isoformat()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO user_ai_keys (user_id, provider, encrypted_key, masked_key, default_model, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, provider) DO UPDATE SET
                  encrypted_key = excluded.encrypted_key,
                  masked_key = excluded.masked_key,
                  default_model = excluded.default_model,
                  updated_at = excluded.updated_at
                """,
                (user_id, provider, encrypted_key, masked_key, default_model, now, now),
            )

    def list_user_ai_keys(self, user_id: str) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                "SELECT provider, masked_key, default_model, updated_at FROM user_ai_keys WHERE user_id = ? ORDER BY provider",
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def get_user_ai_key(self, user_id: str, provider: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM user_ai_keys WHERE user_id = ? AND provider = ?",
                (user_id, provider),
            ).fetchone()
        return dict(row) if row else None

    def get_any_user_ai_key(self, user_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM user_ai_keys WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
                (user_id,),
            ).fetchone()
        return dict(row) if row else None

    def delete_user_ai_key(self, user_id: str, provider: str) -> None:
        with self.connect() as conn:
            conn.execute("DELETE FROM user_ai_keys WHERE user_id = ? AND provider = ?", (user_id, provider))


def create_storage():
    settings = get_settings()
    if settings.database_url:
        from app.services.sqlalchemy_storage import SQLAlchemyStorage

        return SQLAlchemyStorage()
    return Storage()


storage = create_storage()
