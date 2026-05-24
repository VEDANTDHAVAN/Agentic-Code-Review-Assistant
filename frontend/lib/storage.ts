import type { RecentReview } from "./types";

export const RECENT_REVIEWS_KEY = "agentic-code-review-assistant:recent-reviews";

export function readRecentReviews(): RecentReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_REVIEWS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeRecentReviews(reviews: RecentReview[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_REVIEWS_KEY, JSON.stringify(reviews.slice(0, 50)));
}

export function upsertRecentReview(review: RecentReview) {
  const existing = readRecentReviews().filter((item) => item.job_id !== review.job_id);
  writeRecentReviews([review, ...existing].sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at)));
}
