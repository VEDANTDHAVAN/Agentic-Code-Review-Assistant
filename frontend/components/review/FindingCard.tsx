"use client";

import { Check, Code2, MessageSquareText, X } from "lucide-react";
import type { Finding } from "@/lib/types";
import { SeverityBadge } from "./SeverityBadge";

type FindingCardProps = {
  finding: Finding;
  selected: boolean;
  onSelect: (finding: Finding) => void;
  onApprove: (id: string, approved: boolean) => void;
};

export function FindingCard({ finding, selected, onSelect, onApprove }: FindingCardProps) {
  const location = finding.file_path ? `${finding.file_path}${finding.line_number ? `:${finding.line_number}` : ""}` : "PR-level comment";

  return (
    <article className={`rounded-lg border bg-[#0b1220] p-4 transition ${selected ? "border-cyan-400/70 shadow-lg shadow-cyan-950/40" : "border-border hover:border-slate-600"}`}>
      <button className="w-full text-left" onClick={() => onSelect(finding)}>
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="text-xs text-slate-500">{finding.agent ?? "ReviewAgent"}</span>
          {finding.posted ? <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold text-emerald-200">Posted</span> : null}
        </div>
        <h3 className="mt-3 text-sm font-semibold text-white">{finding.title ?? "Untitled finding"}</h3>
        <p className="mt-1 flex items-center gap-2 truncate text-xs text-slate-500">
          <Code2 className="h-3.5 w-3.5 shrink-0" />
          {location}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">{finding.explanation ?? "No explanation was provided."}</p>
        <p className="mt-2 text-sm leading-6 text-cyan-100">
          <span className="font-semibold text-cyan-300">Suggestion:</span> {finding.suggestion ?? "Review this change manually."}
        </p>
        {finding.code_snippet ? (
          <pre className="mt-3 max-h-32 overflow-auto rounded-md border border-border bg-[#050812] p-3 text-xs leading-5 text-slate-200 scrollbar-thin">
            {finding.code_snippet}
          </pre>
        ) : null}
      </button>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${finding.approved ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100" : "border-border bg-white/5 text-slate-200 hover:bg-white/10"}`} onClick={() => onApprove(finding.id, true)} disabled={finding.posted}>
          <Check className="h-4 w-4" />
          Approve
        </button>
        <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white/5 px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50" onClick={() => onApprove(finding.id, false)} disabled={finding.posted}>
          <X className="h-4 w-4" />
          Reject
        </button>
        <span className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-black/20 px-3 text-xs text-slate-500">
          <MessageSquareText className="h-4 w-4" />
          {finding.approved ? "Ready" : "Needs approval"}
        </span>
      </div>
    </article>
  );
}
