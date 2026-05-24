from __future__ import annotations

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.models.schemas import ChangedFile, Finding, PRFetchResponse, PRMetadata


MOCK_PATCH = """@@ -1,18 +1,30 @@
 import os
 import sqlite3
 import subprocess
 
+API_KEY = "sk-demo-hardcoded-secret"
+
 def get_user(conn, user_id):
-    query = "SELECT * FROM users WHERE id = ?"
-    return conn.execute(query, (user_id,)).fetchone()
+    query = "SELECT * FROM users WHERE id = " + user_id
+    return conn.execute(query).fetchone()
 
 def run_task(task):
-    return subprocess.run(["task", task], check=True)
+    return subprocess.call("task " + task, shell=True)
 
 def parse_payload(payload):
+    eval(payload["transform"])
     try:
         return payload["items"][0]["name"].lower()
-    except KeyError:
-        return None
+    except Exception:
+        pass
+
+def sync_users(users, api):
+    for user in users:
+        for group in user["groups"]:
+            api.get("/groups/" + group)
+            print(user["profile"]["email"].lower())
"""


class GitHubClient:
    def __init__(self, token: str | None) -> None:
        self.token = token
        headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self.client = httpx.AsyncClient(base_url="https://api.github.com", headers=headers, timeout=20)

    async def close(self) -> None:
        await self.client.aclose()

    async def fetch_pr(self, owner: str, repo: str, pr_number: int) -> PRFetchResponse:
        if not self.token or get_settings().demo_mode:
            return self.mock_pr(owner, repo, pr_number)

        pr_res = await self._get(f"/repos/{owner}/{repo}/pulls/{pr_number}")
        files_res = await self._get(f"/repos/{owner}/{repo}/pulls/{pr_number}/files?per_page=100")
        commits_res = await self._get(f"/repos/{owner}/{repo}/pulls/{pr_number}/commits?per_page=100")

        pr = pr_res.json()
        files = [
            ChangedFile(
                filename=item["filename"],
                status=item.get("status", "modified"),
                additions=item.get("additions", 0),
                deletions=item.get("deletions", 0),
                changes=item.get("changes", 0),
                patch=item.get("patch") or "",
                raw_url=item.get("raw_url"),
                blob_url=item.get("blob_url"),
            )
            for item in files_res.json()
        ]
        commits = commits_res.json()
        metadata = PRMetadata(
            title=pr.get("title", "Untitled PR"),
            author=pr.get("user", {}).get("login", "unknown"),
            state=pr.get("state", "unknown"),
            html_url=pr.get("html_url", ""),
            base_branch=pr.get("base", {}).get("ref", "main"),
            head_branch=pr.get("head", {}).get("ref", "feature"),
            additions=pr.get("additions", 0),
            deletions=pr.get("deletions", 0),
            changed_files=pr.get("changed_files", len(files)),
        )
        return PRFetchResponse(
            metadata=metadata,
            pr_metadata=metadata,
            files=files,
            commits=commits,
            diffs={file.filename: file.patch for file in files},
            from_mock=False,
        )

    async def _get(self, path: str) -> httpx.Response:
        try:
            res = await self.client.get(path)
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="GitHub request timed out. Try again shortly.") from exc
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach GitHub API.") from exc

        if res.status_code < 400:
            return res

        self._raise_github_error(res)

    def _raise_github_error(self, res: httpx.Response) -> None:
        message = "GitHub API request failed."
        try:
            payload = res.json()
            message = payload.get("message") or message
        except ValueError:
            pass

        remaining = res.headers.get("x-ratelimit-remaining")
        if res.status_code == 401:
            detail = "Invalid GitHub token. Check that your Personal Access Token is correct."
        elif res.status_code == 403 and remaining == "0":
            detail = "GitHub rate limit exceeded. Wait for the rate limit window to reset."
        elif res.status_code == 403:
            detail = "GitHub access denied. The token may not have permission for this repository."
        elif res.status_code == 404:
            detail = "Repository or pull request not found, or the token cannot access it."
        else:
            detail = f"GitHub API error: {message}"
        raise HTTPException(status_code=res.status_code, detail=detail)

    def mock_pr(self, owner: str, repo: str, pr_number: int) -> PRFetchResponse:
        file = ChangedFile(filename="app/review_target.py", status="modified", additions=17, deletions=4, changes=21, patch=MOCK_PATCH)
        metadata = PRMetadata(
            title="Demo PR: add user sync task",
            author="demo-user",
            state="open",
            html_url=f"https://github.com/{owner}/{repo}/pull/{pr_number}",
            base_branch="main",
            head_branch="feature/user-sync",
            additions=17,
            deletions=4,
            changed_files=1,
        )
        return PRFetchResponse(
            metadata=metadata,
            pr_metadata=metadata,
            files=[file],
            commits=[],
            diffs={file.filename: file.patch},
            from_mock=True,
        )

    async def post_finding_comment(self, owner: str, repo: str, pr_number: int, finding: Finding) -> dict:
        if not self.token:
            return {"mock": True, "message": "No GitHub token supplied; simulated post."}
        if not self.token or get_settings().demo_mode:
            return {"mock": True, "message": "No GitHub token supplied or DEMO_MODE enabled; simulated post."}

        body = self._comment_body(finding)
        if finding.file_path and finding.line_number:
            payload = {
                "body": body,
                "commit_id": await self._head_sha(owner, repo, pr_number),
                "path": finding.file_path,
                "line": finding.line_number,
                "side": "RIGHT",
            }
            res = await self.client.post(f"/repos/{owner}/{repo}/pulls/{pr_number}/comments", json=payload)
            if res.status_code < 400:
                return res.json()
            if res.status_code not in {400, 422}:
                self._raise_github_error(res)
        res = await self.client.post(f"/repos/{owner}/{repo}/issues/{pr_number}/comments", json={"body": body})
        if res.status_code >= 400:
            self._raise_github_error(res)
        return res.json()

    async def _head_sha(self, owner: str, repo: str, pr_number: int) -> str:
        res = await self._get(f"/repos/{owner}/{repo}/pulls/{pr_number}")
        return res.json()["head"]["sha"]

    def _comment_body(self, finding: Finding) -> str:
        snippet = f"\n\n```text\n{finding.code_snippet}\n```" if finding.code_snippet else ""
        return (
            f"**Title:** {finding.title}\n\n"
            f"**Severity:** {finding.severity.upper()}\n\n"
            f"**Agent:** {finding.agent}\n\n"
            f"**Explanation:** {finding.explanation}\n\n"
            f"**Suggestion:** {finding.suggestion}\n\n"
            f"**Code snippet:**{snippet if snippet else ' Not available'}"
        )
