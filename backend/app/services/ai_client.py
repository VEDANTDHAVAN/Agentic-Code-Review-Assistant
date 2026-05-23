from __future__ import annotations

from app.core.config import get_settings


class AIClient:
    """Small provider abstraction. MVP uses deterministic fallback unless keys exist."""

    def __init__(self) -> None:
        self.settings = get_settings()

    async def enhance_summary(self, findings_count: int, files_count: int) -> str:
        if self.settings.openai_api_key or self.settings.gemini_api_key or self.settings.anthropic_api_key:
            return (
                f"AI enhancement is configured. Review completed across {files_count} files with "
                f"{findings_count} actionable findings."
            )
        return (
            f"Deterministic mock AI summary: reviewed {files_count} changed file(s) and found "
            f"{findings_count} issue(s). Prioritize critical security and correctness findings first."
        )


ai_client = AIClient()
