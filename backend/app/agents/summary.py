from app.agents.base import BaseAgent, Context, EmitLog
from app.services.ai_client import ai_client


class SummaryAgent(BaseAgent):
    name = "SummaryAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        result = await ai_client.enhance_summary(len(context.get("findings", [])), len(context.get("files", [])), user_id=context.get("user_id"))
        summary = result["summary"]
        context["summary"] = summary
        context["ai_provider"] = result["provider"]
        context["ai_model"] = result["model"]
        if result["source"] == "user":
            await emit("info", f"Using user AI provider: {result['provider']}", self.name, {"provider": result["provider"], "model": result["model"]})
        elif result["source"] == "server":
            await emit("info", f"Using server AI provider: {result['provider']}", self.name, {"provider": result["provider"], "model": result["model"]})
        else:
            await emit("info", "Using deterministic mock AI provider", self.name, {"provider": "mock", "model": result["model"]})
        await emit("summary", "Summary generated", self.name, {"summary": summary, "provider": result["provider"], "model": result["model"], "source": result["source"]})
        await self.sleep()
        return []
