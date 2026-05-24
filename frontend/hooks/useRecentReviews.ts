"use client";

import { useCallback, useEffect, useState } from "react";
import { readRecentReviews, upsertRecentReview, writeRecentReviews } from "@/lib/storage";
import type { RecentReview } from "@/lib/types";

export function useRecentReviews() {
  const [reviews, setReviews] = useState<RecentReview[]>(() => readRecentReviews());

  const refresh = useCallback(() => {
    setReviews(readRecentReviews());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.includes("recent-reviews")) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const addReview = useCallback((review: RecentReview) => {
    upsertRecentReview(review);
    refresh();
  }, [refresh]);

  const removeReview = useCallback((jobId: string) => {
    writeRecentReviews(readRecentReviews().filter((review) => review.job_id !== jobId));
    refresh();
  }, [refresh]);

  const clearReviews = useCallback(() => {
    writeRecentReviews([]);
    refresh();
  }, [refresh]);

  return { reviews, addReview, removeReview, clearReviews, refresh };
}
