"use client";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { ReviewStatus } from "@/lib/types";

type AppShellProps = {
  children: React.ReactNode;
  status?: ReviewStatus;
  apiStatus?: "unknown" | "connected" | "error";
  jobId?: string | null;
};

export function AppShell({ children, status = "idle", apiStatus = "unknown", jobId = null }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header status={status} apiStatus={apiStatus} jobId={jobId} />
          {children}
        </div>
      </div>
    </main>
  );
}
