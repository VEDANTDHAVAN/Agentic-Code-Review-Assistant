from app.agents.base import BaseAgent, Context, EmitLog
from app.services.ai_client import ai_client


class SummaryAgent(BaseAgent):
    name = "SummaryAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        summary = await ai_client.enhance_summary(len(context.get("findings", [])), len(context.get("files", [])))
        context["summary"] = summary
        await emit("summary", "Summary generated", self.name, {"summary": summary})
        await self.sleep()
        return []
