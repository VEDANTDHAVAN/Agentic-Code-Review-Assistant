"use client";

import { Send } from "lucide-react";
import type { Finding } from "@/lib/types";
import { FindingCard } from "./FindingCard";

type FindingsPanelProps = {
  findings: Finding[];
  selectedFindingId?: string | null;
  loading: boolean;
  posting: boolean;
  onSelectFinding: (finding: Finding) => void;
  onApproveFinding: (id: string, approved: boolean) => void;
  onPostApproved: () => void;
};

export function FindingsPanel({ findings, selectedFindingId, loading, posting, onSelectFinding, onApproveFinding, onPostApproved }: FindingsPanelProps) {
  const readyToPost = findings.filter((finding) => finding.approved && !finding.posted).length;

  return (
    <section className="flex min-h-[520px] flex-col rounded-lg border border-border bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Review findings</h2>
          <p className="mt-1 text-xs text-slate-500">{findings.length ? `${findings.length} findings · ${readyToPost} approved` : "Findings will appear after the run completes."}</p>
        </div>
        <button className="inline-flex h-9 items-center gap-2 rounded-md bg-cyan-400 px-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={readyToPost === 0 || posting} onClick={onPostApproved}>
          <Send className="h-4 w-4" />
          {posting ? "Posting" : "Post Approved"}
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4 scrollbar-thin">
        {loading && findings.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-slate-500">Agents are producing review suggestions.</div> : null}
        {!loading && findings.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-slate-500">No findings yet.</div> : null}
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} selected={selectedFindingId === finding.id} onSelect={onSelectFinding} onApprove={onApproveFinding} />
        ))}
      </div>
    </section>
  );
}
