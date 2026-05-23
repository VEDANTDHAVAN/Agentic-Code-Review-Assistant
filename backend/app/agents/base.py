from __future__ import annotations

import asyncio
import re
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from app.models.schemas import Finding, LogEvent

Context = dict[str, Any]
EmitLog = Callable[[str, str, str | None, dict[str, Any] | None], Awaitable[None]]


class BaseAgent:
    name = "BaseAgent"

    async def run(self, context: Context, emit: EmitLog) -> list[Finding]:
        await emit("agent_started", f"{self.name} started", self.name, None)
        findings = await self.analyze(context, emit)
        await emit("agent_completed", f"{self.name} completed", self.name, {"findings": len(findings)})
        return findings

    async def analyze(self, context: Context, emit: EmitLog) -> list[Finding]:
        return []

    async def sleep(self) -> None:
        await asyncio.sleep(0.35)

    def added_lines(self, patch: str) -> list[tuple[int, str]]:
        current_line = 0
        lines: list[tuple[int, str]] = []
        for raw in patch.splitlines():
            header = re.match(r"@@ -\d+(?:,\d+)? \+(\d+)", raw)
            if header:
                current_line = int(header.group(1)) - 1
                continue
            if raw.startswith("+") and not raw.startswith("+++"):
                current_line += 1
                lines.append((current_line, raw[1:]))
            elif not raw.startswith("-"):
                current_line += 1
        return lines

    def finding(
        self,
        file_path: str,
        line_number: int | None,
        severity: str,
        title: str,
        explanation: str,
        suggestion: str,
        code_snippet: str | None,
    ) -> Finding:
        return Finding(
            id=str(uuid.uuid4()),
            agent=self.name,
            file_path=file_path,
            line_number=line_number,
            severity=severity,
            title=title,
            explanation=explanation,
            suggestion=suggestion,
            code_snippet=code_snippet,
        )
