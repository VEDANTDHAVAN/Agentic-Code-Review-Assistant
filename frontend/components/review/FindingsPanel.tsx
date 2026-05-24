"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Send } from "lucide-react";
import type { Finding } from "@/lib/types";
import { FindingCard } from "./FindingCard";
import { FindingsFilters, type FindingsFilterState } from "./FindingsFilters";

type FindingsPanelProps = {
  findings: Finding[];
  selectedFindingId?: string | null;
  loading: boolean;
  posting: boolean;
  onSelectFinding: (finding: Finding) => void;
  onApproveFinding: (id: string, status: "approved" | "rejected") => void;
  onApproveAllSafe: () => void;
  onPostApproved: () => void;
};

const initialFilters: FindingsFilterState = { severity: "all", agent: "all", approval: "all" };

export function FindingsPanel({ findings, selectedFindingId, loading, posting, onSelectFinding, onApproveFinding, onApproveAllSafe, onPostApproved }: FindingsPanelProps) {
  const [filters, setFilters] = useState(initialFilters);
  const statusOf = (finding: Finding) => finding.status ?? (finding.posted ? "posted" : finding.approved ? "approved" : "pending");
  const readyToPost = findings.filter((finding) => statusOf(finding) === "approved").length;
  const counters = {
    total: findings.length,
    critical: findings.filter((finding) => String(finding.severity).toLowerCase() === "critical").length,
    high: findings.filter((finding) => String(finding.severity).toLowerCase() === "high").length,
    approved: findings.filter((finding) => statusOf(finding) === "approved").length,
    posted: findings.filter((finding) => statusOf(finding) === "posted").length,
  };

  const filteredFindings = useMemo(() => findings.filter((finding) => {
    const severityMatch = filters.severity === "all" || String(finding.severity).toLowerCase() === filters.severity;
    const agentMatch = filters.agent === "all" || finding.agent === filters.agent;
    const approvalMatch =
      filters.approval === "all" ||
      filters.approval === statusOf(finding);
    return severityMatch && agentMatch && approvalMatch;
  }), [findings, filters]);

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-border p-4">
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(counters).map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-panel-strong p-2 text-center">
              <div className="text-base font-semibold text-foreground">{value}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
            </div>
          ))}
        </div>
        <FindingsFilters findings={findings} filters={filters} onChange={setFilters} />
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-panel-strong px-3 text-sm font-semibold text-foreground hover:border-primary/60 disabled:opacity-50" onClick={onApproveAllSafe} disabled={posting || findings.length === 0}>
            <CheckCheck className="h-4 w-4" />
            Approve All Safe
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50" disabled={readyToPost === 0 || posting} onClick={onPostApproved}>
            <Send className="h-4 w-4" />
            {posting ? "Posting" : `Post Approved (${readyToPost})`}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3 scrollbar-thin">
        {loading && findings.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">Agents are producing review suggestions.</div> : null}
        {!loading && findings.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">No findings yet.</div> : null}
        {findings.length > 0 && filteredFindings.length === 0 ? <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">No findings match the current filters.</div> : null}
        {filteredFindings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} selected={selectedFindingId === finding.id} onSelect={onSelectFinding} onApprove={onApproveFinding} />
        ))}
      </div>
    </section>
  );
}
