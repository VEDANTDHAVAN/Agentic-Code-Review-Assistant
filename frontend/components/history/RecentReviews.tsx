"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useRecentReviews } from "@/hooks/useRecentReviews";

export function RecentReviews() {
  const { reviews } = useRecentReviews();
  const latest = reviews.slice(0, 5);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <Clock3 className="h-3.5 w-3.5" />
          Recent reviews
        </div>
        <Link className="text-xs font-medium text-primary hover:underline" href="/pull-requests">
          View all
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {latest.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No completed reviews yet.</div>
        ) : (
          latest.map((review) => (
            <Link key={review.job_id} className="block rounded-lg border border-border bg-panel p-3 transition hover:border-primary/60" href={`/pull-requests?job=${review.job_id}`}>
              <div className="truncate text-sm font-semibold text-foreground">{review.owner}/{review.repo} #{review.pr_number}</div>
              <div className="mt-1 truncate text-xs text-muted">{review.title}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                <span>{review.findings_count} findings</span>
                <span>{new Date(review.completed_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
