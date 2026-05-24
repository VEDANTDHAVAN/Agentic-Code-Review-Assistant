from __future__ import annotations

import httpx
from fastapi import HTTPException

from app.services.ai_providers.base import BaseAIProvider


class OpenAIProvider(BaseAIProvider):
    name = "openai"

    async def generate(self, messages: list[dict[str, str]], model: str, temperature: float = 0.2, max_tokens: int = 1200) -> str:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
                )
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="OpenAI request timed out.") from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach OpenAI.") from exc
        if res.status_code == 401:
            raise HTTPException(status_code=400, detail="Invalid OpenAI API key.")
        if res.status_code == 429:
            raise HTTPException(status_code=429, detail="OpenAI rate limit exceeded.")
        if res.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"OpenAI request failed: {res.text[:240]}")
        return self.parse_content(res.json())
