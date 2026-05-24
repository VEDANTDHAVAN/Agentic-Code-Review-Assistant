from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseAIProvider(ABC):
    name: str

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key

    @abstractmethod
    async def generate(self, messages: list[dict[str, str]], model: str, temperature: float = 0.2, max_tokens: int = 1200) -> str:
        pass

    def parse_content(self, payload: dict[str, Any]) -> str:
        try:
            return payload["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("Malformed provider response") from exc
