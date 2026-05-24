"use client";

import { Check, Code2, MessageSquareText, X } from "lucide-react";
import type { Finding } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";

type FindingCardProps = {
  finding: Finding;
  selected: boolean;
  onSelect: (finding: Finding) => void;
  onApprove: (id: string, status: "approved" | "rejected") => void;
};

export function FindingCard({ finding, selected, onSelect, onApprove }: FindingCardProps) {
  const location = finding.file_path ? `${finding.file_path}${finding.line_number ? `:${finding.line_number}` : ""}` : "PR-level comment";
  const status = finding.status ?? (finding.posted ? "posted" : finding.approved ? "approved" : "pending");
  const rejected = status === "rejected";

  return (
    <article className={`rounded-lg border bg-panel-strong p-3 transition ${rejected ? "opacity-55 grayscale" : ""} ${selected ? "border-primary/70 shadow-lg shadow-cyan-950/20" : "border-border hover:border-primary/40"}`}>
      <button className="w-full text-left" onClick={() => onSelect(finding)}>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="text-xs text-muted">{finding.agent ?? "ReviewAgent"}</span>
          <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase ${status === "posted" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200" : status === "approved" ? "border-primary/30 bg-primary/10 text-primary" : status === "rejected" ? "border-slate-400/30 bg-slate-400/10 text-muted" : "border-border bg-panel text-muted"}`}>{status}</span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-foreground">{finding.title ?? "Untitled finding"}</h3>
        <p className="mt-1 flex items-center gap-2 truncate text-xs text-muted">
          <Code2 className="h-3.5 w-3.5 shrink-0" />
          {location}
        </p>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{finding.explanation ?? "No explanation was provided."}</p>
        <p className="mt-2 text-sm leading-6 text-foreground">
          <span className="font-semibold text-primary">Suggestion:</span> {finding.suggestion ?? "Review this change manually."}
        </p>
        {finding.code_snippet ? (
          <pre className="mt-3 max-h-24 overflow-auto rounded-md border border-border bg-background p-3 text-xs leading-5 text-foreground scrollbar-thin">
            {finding.code_snippet}
          </pre>
        ) : null}
      </button>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className={`inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-semibold ${status === "approved" ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-100" : "border-border bg-panel text-foreground hover:border-primary/50"}`} onClick={() => onApprove(finding.id, "approved")} disabled={status === "posted"}>
          <Check className="h-4 w-4" />
          Approve
        </button>
        <button className={`inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-semibold disabled:opacity-50 ${status === "rejected" ? "border-slate-400/40 bg-slate-400/15 text-muted" : "border-border bg-panel text-foreground hover:border-primary/50"}`} onClick={() => onApprove(finding.id, "rejected")} disabled={status === "posted"}>
          <X className="h-4 w-4" />
          Reject
        </button>
        <span className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-panel px-2.5 text-xs text-muted">
          <MessageSquareText className="h-4 w-4" />
          {status === "approved" ? "Ready" : status === "rejected" ? "Skipped" : status === "posted" ? "Posted" : "Needs decision"}
        </span>
      </div>
    </article>
  );
}
