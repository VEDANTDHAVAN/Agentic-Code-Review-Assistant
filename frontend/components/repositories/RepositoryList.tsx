"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GitPullRequest, Lock, Unlock } from "lucide-react";
import { listRepositories } from "@/lib/api";
import type { RepositorySummary } from "@/lib/types";

export function RepositoryList() {
  const [repos, setRepos] = useState<RepositorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRepositories().then(setRepos).catch((err) => setError(err instanceof Error ? err.message : "Failed to load repositories")).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-lg border border-border bg-panel p-8 text-sm text-muted">Loading repositories from GitHub...</div>;
  if (error) return <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-100">{error}</div>;
  if (repos.length === 0) return <div className="rounded-lg border border-dashed border-border bg-panel p-8 text-center text-sm text-muted">No repositories found for this GitHub session.</div>;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {repos.map((repo) => (
        <article key={repo.id} className="rounded-lg border border-border bg-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {repo.private ? <Lock className="h-4 w-4 text-muted" /> : <Unlock className="h-4 w-4 text-muted" />}
                <h2 className="truncate font-semibold text-foreground">{repo.full_name}</h2>
              </div>
              <p className="mt-2 text-sm text-muted">{repo.language ?? "Unknown language"} | {repo.visibility} | Updated {repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : "unknown"}</p>
            </div>
            <span className="rounded-md border border-border bg-panel-strong px-2 py-1 text-xs text-muted">{repo.open_pr_count} open PRs</span>
          </div>
          <Link className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white" href={`/repositories/${repo.owner}/${repo.name}/pull-requests`}>
            <GitPullRequest className="h-4 w-4" />
            View Pull Requests
          </Link>
        </article>
      ))}
    </div>
  );
}
