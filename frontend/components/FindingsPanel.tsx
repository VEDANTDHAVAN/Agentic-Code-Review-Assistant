"use client";

import { Check, Send, ShieldAlert, X } from "lucide-react";
import { Finding } from "@/lib/types";

type Props = {
  findings: Finding[];
  loading: boolean;
  onApprove: (finding: Finding, approved: boolean) => void;
  onPost: (finding: Finding) => void;
  onPostApproved: () => void;
};

const severityClass: Record<Finding["severity"], string> = {
  critical: "bg-rose-100 text-rose-800 border-rose-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

export function FindingsPanel({ findings, loading, onApprove, onPost, onPostApproved }: Props) {
  const approvedCount = findings.filter((finding) => finding.approved && !finding.posted).length;

  return (
    <section className="flex min-h-[580px] flex-col rounded-lg border border-border bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div>
          <h2 className="text-sm font-semibold">Suggested comments</h2>
          <p className="mt-1 text-xs text-slate-500">{findings.length ? `${findings.length} findings, ${approvedCount} ready to post` : "Run a review to generate suggestions."}</p>
        </div>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50" onClick={onPostApproved} disabled={approvedCount === 0}>
          <Send className="h-4 w-4" /> Post approved
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {loading && findings.length === 0 ? <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-slate-500">Agents are reviewing the diff...</div> : null}
        {!loading && findings.length === 0 ? <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-slate-500">No findings yet</div> : null}
        <div className="space-y-3">
          {findings.map((finding) => (
            <article key={finding.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold uppercase ${severityClass[finding.severity]}`}>{finding.severity}</span>
                    <span className="text-xs text-slate-500">{finding.agent}</span>
                    {finding.file_path ? <span className="truncate text-xs text-slate-500">{finding.file_path}:{finding.line_number ?? "PR"}</span> : null}
                  </div>
                  <h3 className="mt-3 text-base font-semibold">{finding.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{finding.explanation}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">Suggestion: {finding.suggestion}</p>
                  {finding.code_snippet ? <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{finding.code_snippet}</pre> : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold ${finding.approved ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-border bg-white text-slate-700 hover:bg-slate-50"}`} onClick={() => onApprove(finding, true)} disabled={finding.posted}>
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={() => onApprove(finding, false)} disabled={finding.posted}>
                  <X className="h-4 w-4" /> Reject
                </button>
                <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50" onClick={() => onPost(finding)} disabled={!finding.approved || finding.posted}>
                  <Send className="h-4 w-4" /> {finding.posted ? "Posted" : "Post"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
