"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, GitPullRequest, Lock, Search, Unlock } from "lucide-react";
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

  const activeRepos = repos.filter((repo) => repo.open_pr_count > 0).sort((a, b) => b.open_pr_count - a.open_pr_count);
  const quietRepos = repos.filter((repo) => repo.open_pr_count === 0);
  const sortedRepos = [...activeRepos, ...quietRepos];

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Repositories</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{repos.length}</p>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Active PR repos</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{activeRepos.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Open PRs</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{repos.reduce((total, repo) => total + repo.open_pr_count, 0)}</p>
        </div>
      </section>

      {activeRepos.length > 0 ? (
        <div className="rounded-lg border border-primary/30 bg-primary/8 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <AlertCircle className="h-4 w-4" />
            {activeRepos.length} repositories need PR review attention
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-panel p-4 text-sm text-muted">
          No active pull requests were found across your repositories.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
      {sortedRepos.map((repo) => {
        const hasOpenPrs = repo.open_pr_count > 0;
        const pullRequestsPath = `/repositories/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}/pull-requests`;
        return (
        <article key={repo.id} className={`relative overflow-hidden rounded-lg border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${hasOpenPrs ? "border-primary/50 bg-primary/10 shadow-cyan-950/10" : "border-border bg-panel opacity-80 hover:opacity-100"}`}>
          {hasOpenPrs ? <div className="absolute inset-x-0 top-0 h-1 bg-primary" /> : null}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {repo.private ? <Lock className="h-4 w-4 text-muted" /> : <Unlock className="h-4 w-4 text-muted" />}
                <h2 className="truncate font-semibold text-foreground">{repo.full_name}</h2>
              </div>
              <p className="mt-2 text-sm text-muted">{repo.language ?? "Unknown language"} | {repo.visibility} | Updated {repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : "unknown"}</p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${hasOpenPrs ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-panel-strong text-muted"}`}>
              <GitPullRequest className="h-3.5 w-3.5" />
              {repo.open_pr_count} open PRs
            </span>
          </div>
          <Link className={`mt-4 inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold ${hasOpenPrs ? "bg-primary text-white hover:brightness-110" : "border border-border bg-panel-strong text-foreground hover:border-primary/60"}`} href={pullRequestsPath}>
            {hasOpenPrs ? <GitPullRequest className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            {hasOpenPrs ? "Review Open PRs" : "View Repository PRs"}
          </Link>
        </article>
      );})}
      </div>
    </div>
  );
}
