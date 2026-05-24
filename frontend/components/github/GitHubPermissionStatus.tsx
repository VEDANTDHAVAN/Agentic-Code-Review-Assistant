"use client";

import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { checkGitHubPermissions } from "@/lib/api";
import type { GitHubPermissionStatus as PermissionStatus } from "@/lib/types";

export function GitHubPermissionStatus() {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStatus(await checkGitHubPermissions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check GitHub permissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const ok = Boolean(status?.has_repo_scope && status?.can_post_comments);

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
              {loading ? "Checking scopes..." : ok ? "Connected with repository/comment permissions." : "Some required MVP scopes are missing."}
            </p>
            {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
            {status ? (
              <div className="mt-2 space-y-1 text-xs text-muted">
                <p>Scopes: {status.scopes.length ? status.scopes.join(", ") : "none detected"}</p>
                {status.warnings.map((warning) => <p key={warning}>- {warning}</p>)}
                {!ok ? <p>Reconnect GitHub in Clerk after updating scopes.</p> : null}
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
