"use client";

import { AlertTriangle, CheckCircle2, CircleDot, PlayCircle, Search, Sparkles } from "lucide-react";
import type { ReviewLogEvent } from "@/lib/types";

type AgentLogItemProps = {
  event: ReviewLogEvent;
};

function eventStyle(type?: string) {
  const normalized = String(type ?? "").toLowerCase();
  if (normalized.includes("error")) return { icon: AlertTriangle, className: "text-rose-300 bg-rose-400/10 border-rose-400/30" };
  if (normalized.includes("finding")) return { icon: Search, className: "text-amber-200 bg-amber-400/10 border-amber-400/30" };
  if (normalized.includes("completed") || normalized.includes("done")) return { icon: CheckCircle2, className: "text-emerald-200 bg-emerald-400/10 border-emerald-400/30" };
  if (normalized.includes("start")) return { icon: PlayCircle, className: "text-cyan-200 bg-cyan-400/10 border-cyan-400/30" };
  if (normalized.includes("summary") || normalized.includes("result")) return { icon: Sparkles, className: "text-violet-200 bg-violet-400/10 border-violet-400/30" };
  return { icon: CircleDot, className: "text-slate-300 bg-white/5 border-border" };
}

export function AgentLogItem({ event }: AgentLogItemProps) {
  const style = eventStyle(event.type);
  const Icon = style.icon;

  return (
    <div className="flex gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${style.className}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{event.agent ?? "Pipeline"}</span>
              <span className="rounded bg-panel px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-muted">{event.type ?? "event"}</span>
              {event.created_at ? <span className="text-[11px] text-muted">{new Date(event.created_at).toLocaleTimeString()}</span> : null}
            </div>
            <p className="mt-1 text-sm leading-5 text-muted">{event.message ?? "Event received"}</p>
      </div>
    </div>
  );
}
