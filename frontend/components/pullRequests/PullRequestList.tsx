"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, GitBranch } from "lucide-react";
import { listPullRequests } from "@/lib/api";
import type { PullRequestSummary } from "@/lib/types";

export function PullRequestList({ owner, repo }: { owner: string; repo: string }) {
  const [prs, setPrs] = useState<PullRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPullRequests(owner, repo).then(setPrs).catch((err) => setError(err instanceof Error ? err.message : "Failed to load pull requests")).finally(() => setLoading(false));
  }, [owner, repo]);

  if (loading) return <div className="rounded-lg border border-border bg-panel p-8 text-sm text-muted">Loading open pull requests...</div>;
  if (error) return <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-100">{error}</div>;
  if (prs.length === 0) return <div className="rounded-lg border border-dashed border-border bg-panel p-8 text-center text-sm text-muted">No open pull requests found.</div>;

  const workspaceBasePath = `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pull-requests`;

  return (
    <div className="space-y-3">
      {prs.map((pr) => (
        <article key={pr.number} className="rounded-lg border border-border bg-panel p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-foreground">#{pr.number} {pr.title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>by {pr.author}</span>
                <GitBranch className="h-4 w-4" />
                <span>{pr.base_branch} &lt;- {pr.head_branch}</span>
                <span>{pr.changed_files} files</span>
                <span className="text-success">+{pr.additions}</span>
                <span className="text-danger">-{pr.deletions}</span>
              </p>
            </div>
            <Link className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white" href={`${workspaceBasePath}/${encodeURIComponent(String(pr.number))}`}>
              <Bot className="h-4 w-4" />
              Open Review Workspace
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
