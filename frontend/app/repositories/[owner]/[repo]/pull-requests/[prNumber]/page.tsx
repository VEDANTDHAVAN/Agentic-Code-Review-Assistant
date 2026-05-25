import { AuthGate } from "@/components/auth/AuthGate";
import { Dashboard } from "@/components/dashboard/Dashboard";

type PullRequestWorkspacePageProps = {
  params: Promise<{
    owner: string;
    repo: string;
    prNumber: string;
  }>;
};

export default async function PullRequestWorkspacePage({ params }: PullRequestWorkspacePageProps) {
  const resolvedParams = await params;
  const owner = decodeURIComponent(resolvedParams.owner);
  const repo = decodeURIComponent(resolvedParams.repo);
  const prNumber = Number(resolvedParams.prNumber) || 1;

  return (
    <AuthGate>
      <Dashboard autoFetchInitial initialReviewInput={{ github_token: "", owner, repo, pr_number: prNumber }} />
    </AuthGate>
  );
}
