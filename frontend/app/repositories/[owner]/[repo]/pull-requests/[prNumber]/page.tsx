"use client";

import { useParams } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function PullRequestWorkspacePage() {
  const params = useParams<{ owner: string; repo: string; prNumber: string }>();
  const owner = decodeURIComponent(params.owner);
  const repo = decodeURIComponent(params.repo);
  const prNumber = Number(params.prNumber) || 1;

  return (
    <AuthGate>
      <Dashboard autoFetchInitial initialReviewInput={{ github_token: "", owner, repo, pr_number: prNumber }} />
    </AuthGate>
  );
}
