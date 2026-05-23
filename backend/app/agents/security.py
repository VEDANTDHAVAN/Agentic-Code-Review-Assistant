import re

from app.agents.base import BaseAgent, Context, EmitLog


class SecurityReviewAgent(BaseAgent):
    name = "SecurityReviewAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        await emit("info", "SecurityReviewAgent analyzing", self.name, None)
        findings = []
        secret_pattern = re.compile(r"(api[_-]?key|secret|token|password)\s*=\s*['\"][^'\"]{8,}", re.I)
        for file_path, patch in context.get("diffs", {}).items():
            for line_no, line in self.added_lines(patch):
                checks = [
                    (secret_pattern.search(line), "critical", "Hardcoded secret", "A credential-like value is committed in source.", "Move secrets to environment variables or a secret manager."),
                    ("eval(" in line, "critical", "Unsafe eval usage", "Dynamic eval can execute attacker-controlled code.", "Replace eval with a safe parser or explicit dispatch table."),
                    (re.search(r"SELECT .*['\"]?\s*\+", line, re.I), "high", "SQL string concatenation", "SQL built by concatenation can allow injection.", "Use parameterized queries or query builders."),
                    (("shell=True" in line or "subprocess.call(" in line) and "+" in line, "high", "Unsafe shell execution", "Shell commands built from strings can allow command injection.", "Pass an argument list and avoid shell=True."),
                ]
                for matched, severity, title, explanation, suggestion in checks:
                    if matched:
                        finding = self.finding(file_path, line_no, severity, title, explanation, suggestion, line.strip())
                        findings.append(finding)
                        await emit("finding", f"Finding detected: {title}", self.name, finding.model_dump())
        await self.sleep()
        return findings
