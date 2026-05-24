"use client";

import { Bot, Clock3, GitPullRequest, LayoutDashboard } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-border bg-[#080d18] px-4 py-5 lg:block">
      <div className="flex items-center gap-3 rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-400/15 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Agentic Code</p>
          <p className="text-xs text-muted">Review Assistant</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        <a className="flex items-center gap-3 rounded-md bg-white/8 px-3 py-2 text-sm font-medium text-white" href="#">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          Dashboard
        </a>
        <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white" href="#">
          <GitPullRequest className="h-4 w-4" />
          Pull requests
        </a>
      </nav>

      <div className="mt-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Clock3 className="h-3.5 w-3.5" />
          Recent reviews
        </div>
        <div className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-slate-500">
          Recent review history will appear here after runs are persisted for user accounts.
        </div>
      </div>
    </aside>
  );
}
