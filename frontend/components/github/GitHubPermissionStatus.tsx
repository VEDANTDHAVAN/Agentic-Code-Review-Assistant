"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { checkGitHubPermissions } from "@/lib/api";
import type { GitHubPermissionStatus as PermissionStatus } from "@/lib/types";

type GitHubPermissionStatusProps = {
  onStatusChange?: (status: PermissionStatus | null) => void;
};

export function GitHubPermissionStatus({ onStatusChange }: GitHubPermissionStatusProps) {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await checkGitHubPermissions();
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check GitHub permissions.");
      onStatusChange?.(null);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const ok = Boolean(status?.has_repo_scope && status?.can_post_comments);
  const githubConnected = Boolean(status?.scopes.length);

  return (
    <section className={`rounded-lg border p-4 ${ok ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-md ${ok ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-200" : "bg-amber-500/15 text-amber-700 dark:text-amber-200"}`}>
            {ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">GitHub permission status</h2>
            <p className="mt-1 text-xs text-muted">
              {loading ? "Checking scopes..." : ok ? "Connected with repository/comment permissions." : githubConnected ? "Some required MVP scopes are missing." : "GitHub is not connected for this account."}
            </p>
            {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
            {status ? (
              <div className="mt-2 space-y-1 text-xs text-muted">
                <p>Scopes: {status.scopes.length ? status.scopes.join(", ") : "none detected"}</p>
                {status.warnings.map((warning) => <p key={warning}>- {warning}</p>)}
                {!githubConnected ? (
                  <p className="font-medium text-amber-800 dark:text-amber-100">
                    If you signed in with email, Google, or magic link, PRism AI still needs a separate GitHub connection before it can read PRs or post approved review comments.
                  </p>
                ) : null}
                {!status.has_repo_scope ? <p className="font-medium text-amber-800 dark:text-amber-100">GitHub access is limited. PRism AI needs repo scope to read PR diffs and post review comments.</p> : null}
                {!ok ? (
                  <p>
                    Connect GitHub or add the required scopes in Clerk/GitHub OAuth, then reconnect GitHub.{" "}
                    <Link className="font-semibold text-primary hover:underline" href="/setup-guide">
                      Open setup guide
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <button className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-panel px-2.5 text-xs font-semibold text-foreground hover:border-primary/60" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </section>
  );
}
