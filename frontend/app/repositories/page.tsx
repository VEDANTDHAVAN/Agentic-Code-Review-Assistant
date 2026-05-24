"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { RepositoryList } from "@/components/repositories/RepositoryList";

export default function RepositoriesPage() {
  return (
    <AuthGate>
      <AppShell>
        <div className="space-y-4 p-4 md:p-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Repositories</h1>
            <p className="mt-1 text-sm text-muted">Choose a repository with active pull requests to start an AI review.</p>
          </div>
          <RepositoryList />
        </div>
      </AppShell>
    </AuthGate>
  );
}
