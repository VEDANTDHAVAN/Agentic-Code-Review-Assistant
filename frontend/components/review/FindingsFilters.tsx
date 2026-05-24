"use client";

import type { Finding } from "@/lib/types";

export type FindingsFilterState = {
  severity: string;
  agent: string;
  approval: string;
};

type FindingsFiltersProps = {
  findings: Finding[];
  filters: FindingsFilterState;
  onChange: (filters: FindingsFilterState) => void;
};

export function FindingsFilters({ findings, filters, onChange }: FindingsFiltersProps) {
  const agents = Array.from(new Set(findings.map((finding) => finding.agent).filter(Boolean))) as string[];

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <label className="space-y-1 text-xs font-medium text-muted">
        Severity
        <select className="h-9 w-full rounded-md border border-border bg-panel-strong px-2 text-sm text-foreground outline-none" value={filters.severity} onChange={(event) => onChange({ ...filters, severity: event.target.value })}>
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium text-muted">
        Agent
        <select className="h-9 w-full rounded-md border border-border bg-panel-strong px-2 text-sm text-foreground outline-none" value={filters.agent} onChange={(event) => onChange({ ...filters, agent: event.target.value })}>
          <option value="all">All</option>
          {agents.map((agent) => <option key={agent} value={agent}>{agent}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium text-muted">
        Status
        <select className="h-9 w-full rounded-md border border-border bg-panel-strong px-2 text-sm text-foreground outline-none" value={filters.approval} onChange={(event) => onChange({ ...filters, approval: event.target.value })}>
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="posted">Posted</option>
        </select>
      </label>
    </div>
  );
}
