from fastapi import APIRouter, Request

from app.models.schemas import GitHubPRFetchRequest, PRFetchResponse
from app.services.auth_service import token_from_request
from app.services.github_client import GitHubClient

router = APIRouter(prefix="/github", tags=["github"])


@router.post("/pr/fetch", response_model=PRFetchResponse)
async def fetch_pr(payload: GitHubPRFetchRequest, request: Request) -> PRFetchResponse:
    client = GitHubClient(payload.github_token or token_from_request(request))
    try:
        return await client.fetch_pr(payload.owner, payload.repo, payload.pr_number)
    finally:
        await client.close()


@router.get("/repositories")
async def list_repositories(request: Request):
    client = GitHubClient(token_from_request(request))
    try:
        return {"repositories": await client.list_repositories()}
    finally:
        await client.close()


@router.get("/repositories/{owner}/{repo}/pulls")
async def list_pull_requests(owner: str, repo: str, request: Request):
    client = GitHubClient(token_from_request(request))
    try:
        return {"pull_requests": await client.list_pull_requests(owner, repo)}
    finally:
        await client.close()
