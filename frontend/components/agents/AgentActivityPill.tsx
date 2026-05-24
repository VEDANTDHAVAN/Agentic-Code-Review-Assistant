"use client";

import { Activity } from "lucide-react";

type AgentActivityPillProps = {
  activeAgent?: string | null;
  lastMessage?: string | null;
  completed: number;
  total: number;
};

export function AgentActivityPill({ activeAgent, lastMessage, completed, total }: AgentActivityPillProps) {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-border bg-panel p-3 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Activity className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-foreground">{activeAgent ?? "Agent pipeline idle"}</span>
            <span className="shrink-0 text-muted">{completed}/{total}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted">{lastMessage ?? "Waiting for agent activity"}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-strong">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
