"use client";

import { useEffect, useRef } from "react";
import type { ReviewLogEvent } from "@/lib/types";
import { AgentLogItem } from "./AgentLogItem";

type AgentTimelineProps = {
  events: ReviewLogEvent[];
};

export function AgentTimeline({ events }: AgentTimelineProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  return (
    <section className="flex min-h-[360px] flex-col rounded-lg border border-border bg-panel">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-white">Agent timeline</h2>
        <p className="mt-1 text-xs text-slate-500">{events.length ? `${events.length} streamed events` : "SSE events will stream here."}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 scrollbar-thin">
        {events.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-slate-500">No agent activity yet.</div> : null}
        {events.map((event, index) => (
          <AgentLogItem key={`${event.id ?? index}-${event.type ?? "event"}-${index}`} event={event} />
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}
