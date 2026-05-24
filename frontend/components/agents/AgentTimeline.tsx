"use client";

import { useEffect, useMemo, useRef } from "react";
import { AGENT_PIPELINE } from "@/lib/constants";
import type { ReviewLogEvent } from "@/lib/types";
import { AgentLogItem } from "./AgentLogItem";

type AgentTimelineProps = {
  events: ReviewLogEvent[];
  activeAgent?: string | null;
};

function statusForAgent(agent: string, events: ReviewLogEvent[], activeAgent?: string | null) {
  if (events.some((event) => event.agent === agent && String(event.type ?? "").toLowerCase().includes("error"))) return "error";
  if (activeAgent === agent) return "running";
  if (events.some((event) => event.agent === agent && String(event.type ?? "").toLowerCase().includes("completed"))) return "completed";
  if (events.some((event) => event.agent === agent)) return "active";
  return "pending";
}

export function AgentTimeline({ events, activeAgent }: AgentTimelineProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const grouped = useMemo(() => AGENT_PIPELINE.map((agent) => ({
    agent,
    status: statusForAgent(agent, events, activeAgent),
    events: events.filter((event) => event.agent === agent),
  })), [activeAgent, events]);
  const latest = events[events.length - 1];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Agent timeline</h2>
        <p className="mt-1 truncate text-xs text-muted">{latest?.message ?? "SSE events will stream here."}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3 scrollbar-thin">
        {events.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">No agent activity yet.</div> : null}
        {grouped.map((group) => (
          <div key={group.agent} className="rounded-lg border border-border bg-panel-strong">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-semibold text-foreground">{group.agent}</span>
              <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${group.status === "error" ? "bg-rose-500/10 text-rose-600 dark:text-rose-200" : group.status === "completed" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : group.status === "running" ? "bg-primary/10 text-primary" : "bg-panel text-muted"}`}>{group.status}</span>
            </div>
            <div className="space-y-3 p-3">
              {group.events.length === 0 ? <p className="text-xs text-muted">Waiting</p> : group.events.map((event, index) => <AgentLogItem key={`${group.agent}-${event.id ?? index}`} event={event} />)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}
