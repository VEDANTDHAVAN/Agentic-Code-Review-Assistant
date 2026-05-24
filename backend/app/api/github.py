from fastapi import APIRouter, Request

from app.models.schemas import GitHubPRFetchRequest, PRFetchResponse
from app.services.github_client import GitHubClient
from app.services.github_token_provider import get_github_access_token

router = APIRouter(prefix="/github", tags=["github"])


@router.post("/pr/fetch", response_model=PRFetchResponse)
async def fetch_pr(payload: GitHubPRFetchRequest, request: Request) -> PRFetchResponse:
    token = get_github_access_token(request=request) or payload.github_token
    client = GitHubClient(token)
    try:
        return await client.fetch_pr(payload.owner, payload.repo, payload.pr_number)
    finally:
        await client.close()


@router.get("/repositories")
async def list_repositories(request: Request):
    client = GitHubClient(get_github_access_token(request=request))
    try:
        return {"repositories": await client.list_repositories()}
    finally:
        await client.close()


@router.get("/repositories/{owner}/{repo}/pulls")
async def list_pull_requests(owner: str, repo: str, request: Request):
    client = GitHubClient(get_github_access_token(request=request))
    try:
        return {"pull_requests": await client.list_pull_requests(owner, repo)}
    finally:
        await client.close()


@router.get("/permissions/check")
async def check_permissions(request: Request):
    token = get_github_access_token(request=request)
    if not token:
        return {
            "scopes": [],
            "has_repo_scope": False,
            "can_post_comments": False,
            "warnings": ["No GitHub token was available. Sign in with GitHub or reconnect Clerk."],
        }

    client = GitHubClient(token)
    try:
        res = await client.client.get("/user")
        scopes = [scope.strip() for scope in res.headers.get("x-oauth-scopes", "").split(",") if scope.strip()]
        has_repo_scope = "repo" in scopes
        warnings = []
        if not has_repo_scope:
            warnings.append("Missing repo scope. Private repos and PR/issue comment posting may fail in MVP OAuth mode.")
        if "workflow" not in scopes:
            warnings.append("Missing workflow scope. GitHub Actions features may be unavailable.")
        return {
            "scopes": scopes,
            "has_repo_scope": has_repo_scope,
            "can_post_comments": has_repo_scope,
            "warnings": warnings,
        }
    finally:
        await client.close()
