"use client";

import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { LogEvent } from "@/lib/types";

export function AgentTimeline({ logs }: { logs: LogEvent[] }) {
  return (
    <section className="flex min-h-[360px] flex-col rounded-lg border border-border bg-white shadow-panel">
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold">Live agent timeline</h2>
        <p className="mt-1 text-xs text-slate-500">{logs.length ? `${logs.length} events streamed` : "Waiting for review events."}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        {logs.length === 0 ? <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-slate-500">No logs yet</div> : null}
        {logs.map((log, index) => {
          const Icon = log.type === "error" ? AlertCircle : log.type.includes("completed") ? CheckCircle2 : Activity;
          return (
            <div key={`${log.id ?? index}-${log.message}`} className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{log.agent ?? "Pipeline"}</span>
                  <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-600">{log.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
