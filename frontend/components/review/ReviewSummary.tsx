"use client";

import { FileCode2, SearchCheck, ShieldCheck } from "lucide-react";
import { AGENT_PIPELINE } from "@/lib/constants";
import type { ChangedFile, Finding, PRFetchResponse } from "@/lib/types";

type ReviewSummaryProps = {
  pr: PRFetchResponse | null;
  findings: Finding[];
  completedAgents: Set<string>;
};

function filesFromResponse(pr: PRFetchResponse | null): ChangedFile[] {
  return pr?.files ?? pr?.changed_files ?? [];
}

export function ReviewSummary({ pr, findings, completedAgents }: ReviewSummaryProps) {
  const files = filesFromResponse(pr);
  const cards = [
    { label: "Files analyzed", value: files.length, icon: FileCode2 },
    { label: "Findings found", value: findings.length, icon: SearchCheck },
    { label: "Agents completed", value: `${completedAgents.size}/${AGENT_PIPELINE.length}`, icon: ShieldCheck },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-lg border border-border bg-panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{card.label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-2xl font-semibold text-foreground">{card.value}</div>
          </div>
        );
      })}
    </section>
  );
}
