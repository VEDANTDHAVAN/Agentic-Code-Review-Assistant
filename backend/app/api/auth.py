from __future__ import annotations

import urllib.parse

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from app.core.config import get_settings
from app.services.auth_service import create_session, current_user
from app.services.storage import storage

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/github/login")
async def github_login():
    settings = get_settings()
    if not settings.github_oauth_client_id:
        raise HTTPException(status_code=500, detail="GitHub OAuth client is not configured.")
    params = urllib.parse.urlencode(
        {
            "client_id": settings.github_oauth_client_id,
            "redirect_uri": settings.github_oauth_callback_url,
            "scope": "repo read:user user:email",
        }
    )
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{params}")


@router.get("/github/callback")
async def github_callback(code: str):
    settings = get_settings()
    if not settings.github_oauth_client_id or not settings.github_oauth_client_secret:
        raise HTTPException(status_code=500, detail="GitHub OAuth client is not configured.")

    async with httpx.AsyncClient(timeout=20) as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.github_oauth_client_id,
                "client_secret": settings.github_oauth_client_secret,
                "code": code,
                "redirect_uri": settings.github_oauth_callback_url,
            },
        )
        token_res.raise_for_status()
        token_payload = token_res.json()
        access_token = token_payload.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub OAuth did not return an access token.")

        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
        )
        user_res.raise_for_status()
        session_id = create_session(user_res.json(), access_token)

    response = RedirectResponse(f"{settings.frontend_url}/dashboard")
    response.set_cookie(
        settings.session_cookie_name,
        session_id,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
    )
    return response


@router.get("/github/me")
async def github_me(request: Request):
    user = current_user(request)
    return {"authenticated": bool(user), "user": user.model_dump() if user else None}


@router.post("/logout")
async def logout(request: Request, response: Response):
    settings = get_settings()
    storage.delete_oauth_session(request.cookies.get(settings.session_cookie_name))
    response.delete_cookie(settings.session_cookie_name)
    return {"ok": True}
