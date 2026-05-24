"use client";

import { useState } from "react";
import { AgentActivityPill } from "@/components/agents/AgentActivityPill";
import { AgentActivityToast } from "@/components/agents/AgentActivityToast";
import { AgentGraph } from "@/components/agents/AgentGraph";
import { AgentTimeline } from "@/components/agents/AgentTimeline";
import { ContextInspector } from "@/components/context/ContextInspector";
import { GitHubForm } from "@/components/github/GitHubForm";
import { GitHubPermissionStatus } from "@/components/github/GitHubPermissionStatus";
import { PRMetadata } from "@/components/github/PRMetadata";
import { AppShell } from "@/components/layout/AppShell";
import { DiffViewer } from "@/components/review/DiffViewer";
import { FindingsPanel } from "@/components/review/FindingsPanel";
import { ReviewSummary } from "@/components/review/ReviewSummary";
import { useReviewSession } from "@/hooks/useReviewSession";
import { useAuth } from "@/hooks/useAuth";
import { useRecentReviews } from "@/hooks/useRecentReviews";

const initialInput = { github_token: "", owner: "", repo: "", pr_number: 1 };
type RightTab = "findings" | "timeline" | "context";

export function Dashboard({ initialReviewInput = initialInput }: { initialReviewInput?: typeof initialInput }) {
  const session = useReviewSession();
  const { user } = useAuth();
  const { reviews } = useRecentReviews();
  const [rightTab, setRightTab] = useState<RightTab>("findings");
  const criticalFindings = reviews.reduce((count, review) => count + (review.results?.findings ?? []).filter((finding) => String(finding.severity).toLowerCase() === "critical").length, 0);
  const pendingComments = session.findings.filter((finding) => (finding.status ?? (finding.posted ? "posted" : finding.approved ? "approved" : "pending")) === "approved").length;

  const tabs: Array<{ id: RightTab; label: string; count?: number }> = [
    { id: "findings", label: "Findings", count: session.findings.length },
    { id: "timeline", label: "Timeline", count: session.events.length },
    { id: "context", label: "Context" },
  ];

  return (
    <AppShell status={session.status} apiStatus={session.apiStatus} jobId={session.jobId}>
      <div className="space-y-4 p-4 md:p-6">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-panel p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Connected user</p>
            <p className="mt-2 truncate text-lg font-semibold text-foreground">{user?.login ?? "Development mode"}</p>
          </div>
          <div className="rounded-lg border border-border bg-panel p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Recent AI reviews</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{reviews.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-panel p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Critical findings</p>
            <p className="mt-2 text-lg font-semibold text-danger">{criticalFindings}</p>
          </div>
          <div className="rounded-lg border border-border bg-panel p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Pending comments</p>
            <p className="mt-2 text-lg font-semibold text-warning">{pendingComments}</p>
          </div>
        </section>
        <GitHubPermissionStatus />
        <GitHubForm initialInput={initialReviewInput} loading={session.loading || session.posting} onFetch={session.handleFetch} onRun={session.handleRun} />

        {session.error ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-100">{session.error}</div> : null}

        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="min-w-0 space-y-4">
            <PRMetadata pr={session.pr} />
            <DiffViewer pr={session.pr} selectedFile={session.selectedFile} selectedFinding={session.selectedFinding} loading={session.loading} onSelectFile={session.setSelectedFile} />
          </div>

          <aside className="flex h-[calc(100vh-144px)] min-h-[620px] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-panel">
            <div className="flex border-b border-border p-2">
              {tabs.map((tab) => (
                <button key={tab.id} className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${rightTab === tab.id ? "bg-primary/12 text-primary" : "text-muted hover:bg-panel-strong hover:text-foreground"}`} onClick={() => setRightTab(tab.id)}>
                  {tab.label}{typeof tab.count === "number" ? ` ${tab.count}` : ""}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              {rightTab === "findings" ? (
                <FindingsPanel findings={session.findings} selectedFindingId={session.selectedFinding?.id} loading={session.status === "running"} posting={session.posting} onSelectFinding={session.selectFinding} onApproveFinding={session.approveFinding} onApproveAllSafe={session.approveAllSafe} onPostApproved={session.postApproved} />
              ) : null}
              {rightTab === "timeline" ? <AgentTimeline events={session.events} activeAgent={session.activeAgent} /> : null}
              {rightTab === "context" ? (
                <ContextInspector
                  state={{
                    job_id: session.jobId,
                    active_agent: session.activeAgent,
                    current_status: session.status,
                    events_count: session.events.length,
                    findings_count: session.findings.length,
                    selected_file: session.selectedFile,
                    selected_finding: session.selectedFinding?.id ?? null,
                  }}
                />
              ) : null}
            </div>
          </aside>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <AgentGraph activeAgent={session.activeAgent} events={session.events} />
          <ReviewSummary pr={session.pr} findings={session.findings} completedAgents={session.completedAgents} />
        </div>
      </div>

      <AgentActivityToast toasts={session.toasts} onDismiss={session.dismissToast} />
      {(session.status === "running" || session.activeAgent) ? <AgentActivityPill activeAgent={session.activeAgent} lastMessage={session.lastEventMessage} completed={session.completedAgents.size} total={session.totalAgents} /> : null}
    </AppShell>
  );
}
