from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from app.models.schemas import UserAIKeyCreateRequest, UserAIKeyPublic, UserAIKeyTestRequest
from app.services.ai_client import AIClient
from app.services.encryption import encrypt_secret, mask_key
from app.services.storage import storage

router = APIRouter(prefix="/user", tags=["user"])


def require_user_id(x_prism_user_id: str | None = Header(default=None)) -> str:
    if not x_prism_user_id:
        raise HTTPException(status_code=401, detail="User id is required.")
    return x_prism_user_id


@router.post("/ai-keys")
async def save_ai_key(payload: UserAIKeyCreateRequest, x_prism_user_id: str | None = Header(default=None)):
    user_id = require_user_id(x_prism_user_id)
    encrypted = encrypt_secret(payload.api_key)
    storage.upsert_user_ai_key(user_id, payload.provider, encrypted, mask_key(payload.api_key), payload.default_model)
    return {"ok": True, "provider": payload.provider, "masked_key": mask_key(payload.api_key), "default_model": payload.default_model}


@router.get("/ai-keys", response_model=list[UserAIKeyPublic])
async def list_ai_keys(x_prism_user_id: str | None = Header(default=None)):
    user_id = require_user_id(x_prism_user_id)
    return [UserAIKeyPublic(**row, connected=True) for row in storage.list_user_ai_keys(user_id)]


@router.delete("/ai-keys/{provider}")
async def delete_ai_key(provider: str, x_prism_user_id: str | None = Header(default=None)):
    if provider not in {"openai", "openrouter"}:
        raise HTTPException(status_code=400, detail="Invalid AI provider.")
    user_id = require_user_id(x_prism_user_id)
    storage.delete_user_ai_key(user_id, provider)
    return {"ok": True}


@router.post("/ai-keys/test")
async def test_ai_key(payload: UserAIKeyTestRequest):
    client = AIClient()
    await client.test_provider(payload.provider, payload.api_key, payload.default_model)
    return {"valid": True, "message": "Connection successful"}
