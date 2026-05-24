from __future__ import annotations

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.services.ai_providers.base import BaseAIProvider


class OpenRouterProvider(BaseAIProvider):
    name = "openrouter"

    async def generate(self, messages: list[dict[str, str]], model: str, temperature: float = 0.2, max_tokens: int = 1200) -> str:
        settings = get_settings()
        try:
            async with httpx.AsyncClient(timeout=40) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": settings.openrouter_app_url,
                        "X-Title": settings.openrouter_app_name,
                    },
                    json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
                )
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="OpenRouter request timed out.") from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach OpenRouter.") from exc
        if res.status_code == 401:
            raise HTTPException(status_code=400, detail="Invalid OpenRouter API key.")
        if res.status_code == 429:
            raise HTTPException(status_code=429, detail="OpenRouter rate limit exceeded.")
        if res.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"OpenRouter request failed: {res.text[:240]}")
        return self.parse_content(res.json())
