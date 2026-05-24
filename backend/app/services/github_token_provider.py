from __future__ import annotations

from fastapi import Request

from app.core.config import get_settings, is_github_app_mode
from app.services.auth_service import token_from_request


def get_github_access_token(user_id: str | None = None, request: Request | None = None) -> str | None:
    settings = get_settings()
    if settings.github_auth_mode == "clerk_oauth":
        return token_from_request(request) if request else None
    if is_github_app_mode():
        raise NotImplementedError("GitHub App mode is planned for production. Configure installation token provider.")
    return token_from_request(request) if request else None
