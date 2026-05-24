"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, GitPullRequest, LayoutDashboard } from "lucide-react";
import { RecentReviews } from "@/components/history/RecentReviews";

export function Sidebar() {
  const pathname = usePathname();
  const itemClass = (active: boolean) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active ? "bg-primary/12 text-foreground" : "text-muted hover:bg-panel-strong hover:text-foreground"}`;

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-border bg-panel px-4 py-5 lg:block">
      <Link className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3" href="/">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Agentic Code Review</p>
          <p className="text-sm font-bold text-foreground">Assistant</p>
        </div>
      </Link>

      <nav className="mt-6 space-y-2">
        <Link className={itemClass(pathname === "/" || pathname === "/dashboard")} href="/">
          <LayoutDashboard className="h-4 w-4 text-primary" />
          Dashboard
        </Link>
        <Link className={itemClass(pathname === "/pull-requests")} href="/pull-requests">
          <GitPullRequest className="h-4 w-4" />
          Pull requests
        </Link>
      </nav>
      <RecentReviews />
    </aside>
  );
}
