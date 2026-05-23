from collections import Counter

from app.agents.base import BaseAgent, Context, EmitLog


class CodeSmellAgent(BaseAgent):
    name = "CodeSmellAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        await emit("info", "CodeSmellAgent analyzing", self.name, None)
        findings = []
        unclear_names = {"x", "y", "tmp", "data", "obj"}
        for file_path, patch in context.get("diffs", {}).items():
            file_findings = []
            added = self.added_lines(patch)
            normalized = Counter(line.strip() for _, line in added if len(line.strip()) > 18)
            for line_no, line in added:
                stripped = line.strip()
                if stripped.startswith("def ") and sum(1 for _, text in added if text.startswith(" ") or text.startswith("\t")) > 40:
                    file_findings.append(self.finding(file_path, line_no, "low", "Large function risk", "This change adds a large block under one function.", "Split complex behavior into focused helpers.", stripped))
                if any(f" {name} " in f" {stripped} " for name in unclear_names) and "=" in stripped:
                    file_findings.append(self.finding(file_path, line_no, "low", "Unclear naming", "Short generic names make review and maintenance harder.", "Use domain-specific names that explain the value.", stripped))
                if normalized[stripped] > 1:
                    file_findings.append(self.finding(file_path, line_no, "low", "Duplicate logic", "The same added line appears multiple times in this diff.", "Extract repeated logic or consolidate the branch.", stripped))
            findings.extend(file_findings)
            for finding in file_findings:
                await emit("finding", f"Finding detected: {finding.title}", self.name, finding.model_dump())
        await self.sleep()
        return findings
