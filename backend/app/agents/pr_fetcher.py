from app.agents.base import BaseAgent, Context, EmitLog
from app.services.github_client import GitHubClient


class PRFetcherAgent(BaseAgent):
    name = "PRFetcherAgent"

    async def analyze(self, context: Context, emit: EmitLog):
        client = GitHubClient(context.get("github_token"))
        try:
            await emit("info", "Fetching PR metadata and changed files", self.name, None)
            pr = await client.fetch_pr(context["owner"], context["repo"], context["pr_number"])
            files = [file.model_dump() for file in pr.files]
            context["pr_metadata"] = pr.metadata.model_dump()
            context["changed_files"] = files
            context["files"] = files
            context["commits"] = pr.commits
            context["diffs"] = pr.diffs
            missing_patch_count = sum(1 for file in pr.files if not file.patch)
            await emit(
                "info",
                "Files fetched",
                self.name,
                {"files": len(pr.files), "commits": len(pr.commits), "missing_patches": missing_patch_count, "from_mock": pr.from_mock},
            )
            await self.sleep()
            return []
        finally:
            await client.close()
