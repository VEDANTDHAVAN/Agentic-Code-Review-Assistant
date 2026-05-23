from __future__ import annotations

import httpx

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
        if not self.token:
            return self.mock_pr(owner, repo, pr_number)
        try:
            pr_res = await self.client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}")
            pr_res.raise_for_status()
            files_res = await self.client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}/files")
            files_res.raise_for_status()
            pr = pr_res.json()
            files = [
                ChangedFile(
                    filename=item["filename"],
                    status=item.get("status", "modified"),
                    additions=item.get("additions", 0),
                    deletions=item.get("deletions", 0),
                    patch=item.get("patch", ""),
                )
                for item in files_res.json()
            ]
            return PRFetchResponse(
                pr_metadata=PRMetadata(
                    title=pr.get("title", "Untitled PR"),
                    author=pr.get("user", {}).get("login", "unknown"),
                    state=pr.get("state", "unknown"),
                    html_url=pr.get("html_url", ""),
                    base_branch=pr.get("base", {}).get("ref", "main"),
                    head_branch=pr.get("head", {}).get("ref", "feature"),
                ),
                files=files,
                diffs={file.filename: file.patch for file in files},
                from_mock=False,
            )
        except Exception:
            return self.mock_pr(owner, repo, pr_number)

    def mock_pr(self, owner: str, repo: str, pr_number: int) -> PRFetchResponse:
        file = ChangedFile(filename="app/review_target.py", status="modified", additions=17, deletions=4, patch=MOCK_PATCH)
        return PRFetchResponse(
            pr_metadata=PRMetadata(
                title="Demo PR: add user sync task",
                author="demo-user",
                state="open",
                html_url=f"https://github.com/{owner}/{repo}/pull/{pr_number}",
                base_branch="main",
                head_branch="feature/user-sync",
            ),
            files=[file],
            diffs={file.filename: file.patch},
            from_mock=True,
        )

    async def post_finding_comment(self, owner: str, repo: str, pr_number: int, finding: Finding) -> dict:
        if not self.token:
            return {"mock": True, "message": "No GitHub token supplied; simulated post."}
        body = f"**{finding.severity.upper()}: {finding.title}**\n\n{finding.explanation}\n\nSuggestion: {finding.suggestion}"
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
        res = await self.client.post(f"/repos/{owner}/{repo}/issues/{pr_number}/comments", json={"body": body})
        res.raise_for_status()
        return res.json()

    async def _head_sha(self, owner: str, repo: str, pr_number: int) -> str:
        res = await self.client.get(f"/repos/{owner}/{repo}/pulls/{pr_number}")
        res.raise_for_status()
        return res.json()["head"]["sha"]
