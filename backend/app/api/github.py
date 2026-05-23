from fastapi import APIRouter

from app.models.schemas import GitHubPRFetchRequest, PRFetchResponse
from app.services.github_client import GitHubClient

router = APIRouter(prefix="/github", tags=["github"])


@router.post("/pr/fetch", response_model=PRFetchResponse)
async def fetch_pr(payload: GitHubPRFetchRequest) -> PRFetchResponse:
    client = GitHubClient(payload.github_token)
    try:
        return await client.fetch_pr(payload.owner, payload.repo, payload.pr_number)
    finally:
        await client.close()
