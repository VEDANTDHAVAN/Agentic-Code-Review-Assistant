from app.agents.base import BaseAgent, Context, EmitLog


class PerformanceReviewAgent(BaseAgent):
    name = "PerformanceReviewAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        await emit("info", "PerformanceReviewAgent analyzing", self.name, None)
        findings = []
        for file_path, patch in context.get("diffs", {}).items():
            added = self.added_lines(patch)
            loop_lines = [idx for idx, (_, line) in enumerate(added) if line.lstrip().startswith("for ")]
            for idx in loop_lines:
                line_no, line = added[idx]
                following = [text for _, text in added[idx + 1 : idx + 8]]
                if any(text.count("for ") or text.lstrip().startswith("for ") for text in following):
                    finding = self.finding(file_path, line_no, "medium", "Nested loop added", "Nested loops can become expensive as data grows.", "Consider pre-indexing data or batching work.", line.strip())
                    findings.append(finding)
                    await emit("finding", "Finding detected: Nested loop added", self.name, finding.model_dump())
                if any(".get(" in text or ".post(" in text or "execute(" in text for text in following):
                    finding = self.finding(file_path, line_no, "medium", "Repeated IO inside loop", "API or database calls inside loops can cause N+1 performance issues.", "Batch requests or move repeated IO outside the loop.", line.strip())
                    findings.append(finding)
                    await emit("finding", "Finding detected: Repeated IO inside loop", self.name, finding.model_dump())
        await self.sleep()
        return findings
