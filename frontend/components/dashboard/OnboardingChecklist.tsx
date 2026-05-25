"use client";

import Link from "next/link";
import { CheckCircle2, CircleDashed, Github, KeyRound, Search, ShieldCheck } from "lucide-react";
import type { GitHubPermissionStatus, UserAIKeyPublic } from "@/lib/types";

type OnboardingChecklistProps = {
  githubConnected: boolean;
  permissions: GitHubPermissionStatus | null;
  aiKeys: UserAIKeyPublic[];
  repositorySelected: boolean;
  reviewCompleted: boolean;
};

export function OnboardingChecklist({ githubConnected, permissions, aiKeys, repositorySelected, reviewCompleted }: OnboardingChecklistProps) {
  const requiredScopesVerified = Boolean(permissions?.has_repo_scope && permissions?.can_post_comments);
  const aiReady = aiKeys.length > 0;
  const items = [
    {
      label: "GitHub connected",
      done: githubConnected,
      action: { label: "Connect GitHub", href: "/" },
      icon: Github,
    },
    {
      label: "Required scopes verified",
      done: requiredScopesVerified,
      action: { label: "Refresh permissions", href: "#github-permissions" },
      icon: ShieldCheck,
    },
    {
      label: "AI provider configured or mock mode enabled",
      done: aiReady,
      action: { label: aiReady ? "Manage provider" : "Configure BYOK", href: "/settings" },
      icon: KeyRound,
      helper: aiReady ? "Saved BYOK provider detected." : "Mock mode is available until a key is configured.",
    },
    {
      label: "Repository selected",
      done: repositorySelected,
      action: { label: "Browse repositories", href: "/repositories" },
      icon: Search,
    },
    {
      label: "First PR review completed",
      done: reviewCompleted,
      action: { label: "View review history", href: "/pull-requests" },
      icon: CheckCircle2,
    },
  ];

  if (items.every((item) => item.done)) return null;

  return (
    <section className="rounded-lg border border-border bg-panel p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Production onboarding checklist</h2>
          <p className="mt-1 text-xs text-muted">Complete these steps before running fully connected AI PR reviews.</p>
        </div>
        <Link className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-panel-strong px-3 text-xs font-semibold text-foreground hover:border-primary/60" href="/setup-guide">
          Setup Guide
        </Link>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-md border p-3 ${item.done ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-background"}`}>
              <div className="flex items-start gap-2">
                {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  </div>
                  {item.helper ? <p className="mt-1 text-xs leading-5 text-muted">{item.helper}</p> : null}
                  {!item.done ? (
                    <Link className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline" href={item.action.href}>
                      {item.action.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
