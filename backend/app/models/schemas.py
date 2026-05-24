from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


Severity = Literal["low", "medium", "high", "critical"]


class GitHubPRFetchRequest(BaseModel):
    github_token: str | None = None
    owner: str = "demo"
    repo: str = "agentic-demo"
    pr_number: int = 1


class ReviewRunRequest(GitHubPRFetchRequest):
    pass


class PostCommentRequest(GitHubPRFetchRequest):
    comment_id: str


class PRMetadata(BaseModel):
    title: str
    author: str
    state: str
    html_url: str
    base_branch: str
    head_branch: str
    additions: int = 0
    deletions: int = 0
    changed_files: int = 0


class ChangedFile(BaseModel):
    filename: str
    status: str
    additions: int = 0
    deletions: int = 0
    changes: int = 0
    patch: str = ""
    raw_url: str | None = None
    blob_url: str | None = None


class PRFetchResponse(BaseModel):
    metadata: PRMetadata
    pr_metadata: PRMetadata
    files: list[ChangedFile]
    commits: list[dict[str, Any]] = Field(default_factory=list)
    diffs: dict[str, str]
    from_mock: bool = False


class Finding(BaseModel):
    id: str
    agent: str
    file_path: str | None = None
    line_number: int | None = None
    severity: Severity = "medium"
    title: str
    explanation: str
    suggestion: str
    code_snippet: str | None = None
    approved: bool = False
    posted: bool = False


class LogEvent(BaseModel):
    id: int | None = None
    job_id: str
    type: str
    message: str
    agent: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReviewJob(BaseModel):
    id: str
    status: Literal["queued", "running", "completed", "failed"]
    owner: str
    repo: str
    pr_number: int
    created_at: datetime
    completed_at: datetime | None = None


class ReviewResultsResponse(BaseModel):
    job: ReviewJob
    findings: list[Finding]
    summary: str | None = None
    logs: list[LogEvent] = Field(default_factory=list)


class ApprovalRequest(BaseModel):
    approved: bool
