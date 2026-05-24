"use client";

import { useParams } from "next/navigation";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { PullRequestList } from "@/components/pullRequests/PullRequestList";

export default function RepositoryPullRequestsPage() {
  const params = useParams<{ owner: string; repo: string }>();
  return (
    <AuthGate>
      <AppShell>
        <div className="space-y-4 p-4 md:p-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{params.owner}/{params.repo} pull requests</h1>
            <p className="mt-1 text-sm text-muted">Open a PR review workspace or run an AI review.</p>
          </div>
          <PullRequestList owner={params.owner} repo={params.repo} />
        </div>
      </AppShell>
    </AuthGate>
  );
}
