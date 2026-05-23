from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.bug import BugDetectionAgent
from app.agents.code_smell import CodeSmellAgent
from app.agents.context_builder import ContextBuilderAgent
from app.agents.performance import PerformanceReviewAgent
from app.agents.pr_fetcher import PRFetcherAgent
from app.agents.security import SecurityReviewAgent
from app.agents.summary import SummaryAgent
from app.models.schemas import ApprovalRequest, LogEvent, PostCommentRequest, ReviewResultsResponse, ReviewRunRequest
from app.services.github_client import GitHubClient
from app.services.storage import storage

router = APIRouter(prefix="/review", tags=["review"])


async def run_pipeline(job_id: str, payload: ReviewRunRequest) -> None:
    context: dict[str, Any] = {
        "github_token": payload.github_token,
        "owner": payload.owner,
        "repo": payload.repo,
        "pr_number": payload.pr_number,
        "pr_metadata": None,
        "files": [],
        "diffs": {},
        "repo_context": {},
        "findings": [],
        "summary": None,
    }

    async def emit(type_: str, message: str, agent: str | None = None, metadata: dict[str, Any] | None = None) -> None:
        storage.add_log(LogEvent(job_id=job_id, type=type_, agent=agent, message=message, metadata=metadata or {}))

    storage.update_job_status(job_id, "running")
    await emit("job_started", "Review job started", "Pipeline", {"job_id": job_id})
    try:
        agents = [
            PRFetcherAgent(),
            ContextBuilderAgent(),
            SecurityReviewAgent(),
            BugDetectionAgent(),
            PerformanceReviewAgent(),
            CodeSmellAgent(),
            SummaryAgent(),
        ]
        for agent in agents:
            findings = await agent.run(context, emit)
            if findings:
                context["findings"].extend(findings)
                storage.save_findings(job_id, findings)
        storage.update_job_status(job_id, "completed")
        await emit("job_completed", "Review completed", "Pipeline", {"findings": len(context["findings"])})
    except Exception as exc:
        storage.update_job_status(job_id, "failed")
        await emit("error", f"Review failed: {exc}", "Pipeline", {"error": str(exc)})


@router.post("/run")
async def run_review(payload: ReviewRunRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    storage.create_job(job_id, payload.owner, payload.repo, payload.pr_number)
    background_tasks.add_task(run_pipeline, job_id, payload)
    return {"job_id": job_id}


@router.get("/stream/{job_id}")
async def stream_review(job_id: str):
    if not storage.get_job(job_id):
        raise HTTPException(status_code=404, detail="Review job not found")

    async def event_stream():
        last_id = 0
        while True:
            logs = storage.list_logs(job_id, last_id)
            for log in logs:
                last_id = log.id or last_id
                yield f"data: {json.dumps(log.model_dump(mode='json'))}\n\n"
            job = storage.get_job(job_id)
            if job and job.status in {"completed", "failed"} and not logs:
                yield f"data: {json.dumps({'type': 'stream_closed', 'job_id': job_id, 'created_at': datetime.utcnow().isoformat()})}\n\n"
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/results/{job_id}", response_model=ReviewResultsResponse)
async def get_results(job_id: str) -> ReviewResultsResponse:
    job = storage.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Review job not found")
    logs = storage.list_logs(job_id)
    summary = next((log.metadata.get("summary") for log in reversed(logs) if log.type == "summary"), None)
    return ReviewResultsResponse(job=job, findings=storage.list_findings(job_id), summary=summary, logs=logs)


@router.patch("/findings/{finding_id}/approval")
async def update_approval(finding_id: str, payload: ApprovalRequest):
    if not storage.get_finding(finding_id):
        raise HTTPException(status_code=404, detail="Finding not found")
    storage.update_finding_flags(finding_id, approved=payload.approved)
    return {"ok": True, "finding_id": finding_id, "approved": payload.approved}


@router.post("/comment/post")
async def post_comment(payload: PostCommentRequest):
    finding = storage.get_finding(payload.comment_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if not finding.approved:
        raise HTTPException(status_code=400, detail="Finding must be approved before posting")
    client = GitHubClient(payload.github_token)
    try:
        result = await client.post_finding_comment(payload.owner, payload.repo, payload.pr_number, finding)
        storage.update_finding_flags(finding.id, posted=True)
        return {"ok": True, "github_response": result}
    finally:
        await client.close()
