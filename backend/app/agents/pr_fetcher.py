from app.agents.base import BaseAgent, Context, EmitLog
from app.services.github_client import GitHubClient


class PRFetcherAgent(BaseAgent):
    name = "PRFetcherAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        client = GitHubClient(context.get("github_token"))
        try:
            await emit("info", "Fetching PR metadata and changed files", self.name, None)
            pr = await client.fetch_pr(context["owner"], context["repo"], context["pr_number"])
            context["pr_metadata"] = pr.pr_metadata.model_dump()
            context["files"] = [file.model_dump() for file in pr.files]
            context["diffs"] = pr.diffs
            await emit("info", "Files fetched", self.name, {"files": len(pr.files), "from_mock": pr.from_mock})
            await self.sleep()
            return []
        finally:
            await client.close()
