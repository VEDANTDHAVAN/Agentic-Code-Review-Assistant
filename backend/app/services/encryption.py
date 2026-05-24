from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.core.config import get_settings


def _fernet() -> Fernet:
    key_material = get_settings().app_encryption_key
    if not key_material:
        raise HTTPException(status_code=400, detail="APP_ENCRYPTION_KEY is required to save AI API keys. Add it to backend .env and restart the backend.")
    key = base64.urlsafe_b64encode(hashlib.sha256(key_material.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_secret(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str) -> str:
    return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")


def mask_key(value: str) -> str:
    if len(value) <= 8:
        return "****"
    return f"{value[:4]}...{value[-4:]}"
