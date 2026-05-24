from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.ai_providers.openrouter_provider import OpenRouterProvider
from app.services.encryption import decrypt_secret
from app.services.storage import storage


class AIClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _provider(self, provider: str, api_key: str):
        if provider == "openai":
            return OpenAIProvider(api_key)
        if provider == "openrouter":
            return OpenRouterProvider(api_key)
        raise ValueError("Invalid AI provider")

    def _server_config(self) -> dict[str, str] | None:
        provider = self.settings.default_ai_provider
        if provider == "openai" and self.settings.openai_api_key:
            return {"provider": "openai", "api_key": self.settings.openai_api_key, "model": self.settings.default_openai_model, "source": "server"}
        # OpenRouter server key is intentionally read dynamically to avoid older settings objects breaking.
        openrouter_key = getattr(self.settings, "openrouter_api_key", None)
        if provider == "openrouter" and openrouter_key:
            return {"provider": "openrouter", "api_key": openrouter_key, "model": self.settings.default_openrouter_model, "source": "server"}
        if self.settings.openai_api_key:
            return {"provider": "openai", "api_key": self.settings.openai_api_key, "model": self.settings.default_openai_model, "source": "server"}
        if openrouter_key:
            return {"provider": "openrouter", "api_key": openrouter_key, "model": self.settings.default_openrouter_model, "source": "server"}
        return None

    def resolve_config(self, user_id: str | None = None) -> dict[str, Any]:
        if user_id:
            preferred = storage.get_user_ai_key(user_id, self.settings.default_ai_provider)
            row = preferred or storage.get_any_user_ai_key(user_id)
            if row:
                return {
                    "provider": row["provider"],
                    "api_key": decrypt_secret(row["encrypted_key"]),
                    "model": row["default_model"],
                    "source": "user",
                }
        server = self._server_config()
        if server:
            return server
        return {"provider": "mock", "api_key": None, "model": "deterministic-mock", "source": "mock"}

    async def generate(self, messages: list[dict[str, str]], user_id: str | None = None, temperature: float = 0.2, max_tokens: int = 1200) -> dict[str, str]:
        config = self.resolve_config(user_id)
        if config["provider"] == "mock":
            return {
                "provider": "mock",
                "model": config["model"],
                "source": "mock",
                "content": "Deterministic mock AI response.",
            }
        provider = self._provider(config["provider"], config["api_key"])
        content = await provider.generate(messages, config["model"], temperature=temperature, max_tokens=max_tokens)
        return {"provider": config["provider"], "model": config["model"], "source": config["source"], "content": content}

    async def test_provider(self, provider: str, api_key: str, model: str) -> None:
        selected = self._provider(provider, api_key)
        await selected.generate(
            [{"role": "user", "content": "Reply with the word ok."}],
            model=model,
            temperature=0,
            max_tokens=10,
        )

    async def enhance_summary(self, findings_count: int, files_count: int, user_id: str | None = None) -> dict[str, str]:
        config = self.resolve_config(user_id)
        if config["provider"] == "mock":
            return {
                "summary": (
                    f"Deterministic mock AI summary: reviewed {files_count} changed file(s) and found "
                    f"{findings_count} issue(s). Prioritize critical security and correctness findings first."
                ),
                "provider": "mock",
                "model": "deterministic-mock",
                "source": "mock",
            }
        result = await self.generate(
            [
                {"role": "system", "content": "You summarize pull request review findings for engineers. Be concise and actionable."},
                {"role": "user", "content": f"Summarize a PR review over {files_count} files with {findings_count} findings."},
            ],
            user_id=user_id,
            max_tokens=220,
        )
        return {"summary": result["content"], "provider": result["provider"], "model": result["model"], "source": result["source"]}


ai_client = AIClient()
