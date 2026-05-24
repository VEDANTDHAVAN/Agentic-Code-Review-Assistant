"use client";

import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import type { RecentReview } from "@/lib/types";

type ReviewHistoryTableProps = {
  reviews: RecentReview[];
  selectedJobId?: string | null;
  onRemove: (jobId: string) => void;
};

export function ReviewHistoryTable({ reviews, selectedJobId, onRemove }: ReviewHistoryTableProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-panel p-10 text-center">
        <h2 className="text-lg font-semibold text-foreground">No review history yet</h2>
        <p className="mt-2 text-sm text-muted">Run your first PR review from the dashboard, then completed sessions will appear here.</p>
        <Link className="mt-5 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-panel">
      <div className="grid grid-cols-[1.1fr_0.35fr_1.2fr_0.45fr_0.55fr_0.55fr_auto] gap-3 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>Repo</span>
        <span>PR</span>
        <span>Title</span>
        <span>Status</span>
        <span>Findings</span>
        <span>Completed</span>
        <span>Actions</span>
      </div>
      {reviews.map((review) => (
        <div key={review.job_id} className={`grid grid-cols-[1.1fr_0.35fr_1.2fr_0.45fr_0.55fr_0.55fr_auto] gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 ${selectedJobId === review.job_id ? "bg-primary/10" : ""}`}>
          <span className="truncate font-medium text-foreground">{review.owner}/{review.repo}</span>
          <span className="text-muted">#{review.pr_number}</span>
          <span className="truncate text-muted">{review.title}</span>
          <span className="text-muted">{review.status}</span>
          <span className="text-muted">{review.findings_count}</span>
          <span className="text-muted">{new Date(review.completed_at).toLocaleString()}</span>
          <div className="flex justify-end gap-2">
            <Link className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:border-primary/60" href={`/pull-requests?job=${review.job_id}`} aria-label="Open stored review">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:border-danger/60" onClick={() => onRemove(review.job_id)} aria-label="Remove review">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
