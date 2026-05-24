from __future__ import annotations

import base64
import hashlib
import secrets

from cryptography.fernet import Fernet
from fastapi import HTTPException, Request

from app.core.config import get_settings
from app.models.schemas import GitHubUser
from app.services.storage import storage


def _fernet() -> Fernet:
    settings = get_settings()
    material = settings.session_secret_key.encode("utf-8")
    key = base64.urlsafe_b64encode(hashlib.sha256(material).digest())
    return Fernet(key)


def encrypt_token(token: str) -> str:
    return _fernet().encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_token: str) -> str:
    return _fernet().decrypt(encrypted_token.encode("utf-8")).decode("utf-8")


def create_session(user: dict, access_token: str) -> str:
    session_id = secrets.token_urlsafe(32)
    storage.save_oauth_session(
        {
            "session_id": session_id,
            "github_user_id": user["id"],
            "login": user["login"],
            "name": user.get("name"),
            "avatar_url": user.get("avatar_url"),
            "html_url": user.get("html_url"),
            "encrypted_token": encrypt_token(access_token),
        }
    )
    return session_id


def session_from_request(request: Request) -> dict | None:
    settings = get_settings()
    return storage.get_oauth_session(request.cookies.get(settings.session_cookie_name))


def token_from_request(request: Request) -> str | None:
    session = session_from_request(request)
    if not session:
        return None
    return decrypt_token(session["encrypted_token"])


def current_user(request: Request) -> GitHubUser | None:
    session = session_from_request(request)
    if not session:
        return None
    return GitHubUser(
        id=session["github_user_id"],
        login=session["login"],
        name=session.get("name"),
        avatar_url=session.get("avatar_url"),
        html_url=session.get("html_url"),
    )


def require_token(request: Request) -> str:
    token = token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="GitHub login required.")
    return token
