"use client";

import { useParams } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function PullRequestWorkspacePage() {
  const params = useParams<{ owner: string; repo: string; prNumber: string }>();
  return (
    <AuthGate>
      <Dashboard initialReviewInput={{ github_token: "", owner: params.owner, repo: params.repo, pr_number: Number(params.prNumber) || 1 }} />
    </AuthGate>
  );
}
