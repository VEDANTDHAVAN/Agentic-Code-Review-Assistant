from app.agents.base import BaseAgent, Context, EmitLog


class ContextBuilderAgent(BaseAgent):
    name = "ContextBuilderAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        files = context.get("files", [])
        extensions = sorted({file["filename"].split(".")[-1] for file in files if "." in file["filename"]})
        context["repo_context"] = {
            "file_count": len(files),
            "languages": extensions,
            "risk_profile": "MVP heuristic review over changed lines only",
        }
        await emit("info", "Repository context built", self.name, context["repo_context"])
        await self.sleep()
        return []
