"use client";

import type { Severity } from "@/lib/types";

type SeverityBadgeProps = {
  severity?: Severity | string;
};

const classes: Record<string, string> = {
  critical: "border-rose-400/40 bg-rose-400/15 text-rose-200",
  high: "border-orange-400/40 bg-orange-400/15 text-orange-200",
  medium: "border-amber-400/40 bg-amber-400/15 text-amber-100",
  low: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  info: "border-cyan-400/40 bg-cyan-400/15 text-cyan-100",
};

export function SeverityBadge({ severity = "info" }: SeverityBadgeProps) {
  const normalized = String(severity || "info").toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${classes[normalized] ?? classes.info}`}>
      {normalized}
    </span>
  );
}
