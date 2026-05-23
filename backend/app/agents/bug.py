import re

from app.agents.base import BaseAgent, Context, EmitLog


class BugDetectionAgent(BaseAgent):
    name = "BugDetectionAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        await emit("info", "BugDetectionAgent analyzing", self.name, None)
        findings = []
        for file_path, patch in context.get("diffs", {}).items():
            for line_no, line in self.added_lines(patch):
                checks = [
                    (re.search(r"\[[\"'][^\"']+[\"']\]", line) and "if " not in line, "medium", "Possible missing key/null guard", "Direct nested access may fail when data is missing.", "Validate the object shape or use safe access before dereferencing."),
                    ("except Exception" in line, "medium", "Broad exception handler", "Catching every exception can hide real defects.", "Catch specific exceptions and preserve useful failure context."),
                    (line.strip() == "pass", "high", "Swallowed error", "An exception path silently discards failures.", "Log, return an explicit error, or re-raise after cleanup."),
                ]
                for matched, severity, title, explanation, suggestion in checks:
                    if matched:
                        finding = self.finding(file_path, line_no, severity, title, explanation, suggestion, line.strip())
                        findings.append(finding)
                        await emit("finding", f"Finding detected: {title}", self.name, finding.model_dump())
        await self.sleep()
        return findings
