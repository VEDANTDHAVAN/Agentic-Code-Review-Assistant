"use client";

import { Activity, CircleCheck, CircleDashed, CircleX } from "lucide-react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ReviewStatus } from "@/lib/types";

type HeaderProps = {
  status: ReviewStatus;
  apiStatus: "unknown" | "connected" | "error";
  jobId?: string | null;
};

const statusCopy: Record<ReviewStatus, string> = {
  idle: "Idle",
  fetching: "Fetching PR",
  ready: "PR loaded",
  running: "Review running",
  completed: "Review completed",
  failed: "Review failed",
};

export function Header({ status, apiStatus, jobId }: HeaderProps) {
  const StatusIcon = status === "failed" ? CircleX : status === "completed" ? CircleCheck : status === "running" ? Activity : CircleDashed;
  const { toggleTheme } = useTheme();

  return (
    <header className="flex flex-col gap-3 border-b border-border bg-panel/90 px-4 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">AI Pull Request Review</h1>
        <p className="mt-1 text-sm text-muted">Fetch a GitHub PR, run the agent pipeline, approve comments, and post them.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {jobId ? <span className="rounded-md border border-border bg-panel-strong px-3 py-2 text-xs text-muted">Job {jobId.slice(0, 8)}</span> : null}
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-panel-strong px-3 py-2 text-xs font-medium text-foreground">
          <StatusIcon className="h-3.5 w-3.5 text-primary" />
          {statusCopy[status]}
        </span>
        <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${apiStatus === "error" ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-200" : apiStatus === "connected" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : "border-border bg-panel-strong text-muted"}`}>
          <span className={`h-2 w-2 rounded-full ${apiStatus === "error" ? "bg-danger" : apiStatus === "connected" ? "bg-success" : "bg-slate-500"}`} />
          API {apiStatus}
        </span>
        <button aria-label="Toggle theme" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-panel-strong text-foreground hover:border-primary/60" onClick={toggleTheme}>
          <Sun className="hidden h-4 w-4 dark:block" />
          <Moon className="h-4 w-4 dark:hidden" />
        </button>
      </div>
    </header>
  );
}
