from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.models.schemas import Finding, LogEvent, ReviewJob


class Storage:
    def __init__(self) -> None:
        self.db_path = Path(get_settings().database_path)
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
                """
            )

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
                    (id, job_id, agent, file_path, line_number, severity, title, explanation, suggestion, code_snippet, approved, posted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        )

    def update_finding_flags(self, finding_id: str, **flags: Any) -> None:
        allowed = {"approved", "posted"}
        updates = [(key, int(value)) for key, value in flags.items() if key in allowed]
        if not updates:
            return
        clause = ", ".join(f"{key} = ?" for key, _ in updates)
        values = [value for _, value in updates] + [finding_id]
        with self.connect() as conn:
            conn.execute(f"UPDATE findings SET {clause} WHERE id = ?", values)

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


storage = Storage()
