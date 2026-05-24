"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ReviewHistoryTable } from "@/components/history/ReviewHistoryTable";
import { FindingCard } from "@/components/review/FindingCard";
import { useRecentReviews } from "@/hooks/useRecentReviews";

function PullRequestsContent() {
  const params = useSearchParams();
  const selectedJobId = params.get("job");
  const { reviews, removeReview } = useRecentReviews();
  const selected = reviews.find((review) => review.job_id === selectedJobId);

  return (
    <AppShell>
      <div className="space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Review history</h1>
          <p className="mt-1 text-sm text-muted">Completed review sessions stored locally in this browser.</p>
        </div>
        <ReviewHistoryTable reviews={reviews} selectedJobId={selectedJobId} onRemove={removeReview} />

        {selected ? (
          <section className="rounded-lg border border-border bg-panel">
            <div className="border-b border-border p-4">
              <h2 className="text-sm font-semibold text-foreground">Stored results for {selected.owner}/{selected.repo} #{selected.pr_number}</h2>
              <p className="mt-1 text-xs text-muted">{selected.title}</p>
            </div>
            <div className="grid gap-3 p-4 lg:grid-cols-2">
              {(selected.results?.findings ?? []).length === 0 ? <div className="text-sm text-muted">No stored findings for this review.</div> : null}
              {(selected.results?.findings ?? []).map((finding) => (
                <FindingCard key={finding.id} finding={finding} selected={false} onSelect={() => undefined} onApprove={() => undefined} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function PullRequestsPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-6 text-sm text-muted">Loading review history...</div></AppShell>}>
      <PullRequestsContent />
    </Suspense>
  );
}
