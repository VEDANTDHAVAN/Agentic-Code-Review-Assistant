"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Bot, CheckCircle2, FileCode2, Github, GitPullRequest, LockKeyhole, PlayCircle, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { PublicHeader } from "./PublicHeader";

const steps = [
  { title: "Connect GitHub", text: "Sign in through Clerk and grant the GitHub scopes needed for PR review.", icon: Github },
  { title: "Select Repository and Pull Request", text: "Choose an open pull request and load metadata, changed files, and diffs.", icon: GitPullRequest },
  { title: "Run AI Review", text: "Specialized agents scan for bugs, security risks, performance issues, and code smells.", icon: Bot },
  { title: "Approve and Post Comments", text: "You stay in control. Only approved findings are posted back to GitHub.", icon: CheckCircle2 },
];

const scopes = [
  ["read:user", "Read GitHub profile information."],
  ["user:email", "Identify the signed-in user's verified email."],
  ["repo", "Read repositories, pull requests, diffs, and post PR or issue comments."],
  ["workflow", "Optional for future GitHub Actions and CI analysis."],
];

const setupSteps = [
  "Create a Clerk application.",
  "Enable GitHub social connection.",
  "Create a GitHub OAuth App.",
  "Copy GitHub Client ID and Client Secret into Clerk custom credentials.",
  "Add scopes in Clerk: read:user user:email repo workflow.",
  "Copy the Clerk redirect URL into the GitHub OAuth App callback URL.",
  "Restart the app and reconnect GitHub after scope changes.",
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_460px] lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered pull request reviews for engineering teams
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-normal text-foreground md:text-6xl">PRism AI</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            PRism AI connects to GitHub, analyzes pull requests with specialized AI agents, detects bugs, security risks, performance bottlenecks, and code smells, then generates actionable review comments.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
              <button className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:brightness-110">
                <Github className="h-4 w-4" />
                Continue with GitHub
              </button>
            </SignInButton>
            <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-panel px-5 text-sm font-semibold text-foreground hover:border-primary/60" href="/setup-guide">
              View Setup Guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-panel p-4 shadow-2xl shadow-black/10">
          <div className="rounded-md border border-border bg-panel-strong p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Review Summary</p>
                <p className="mt-1 text-xs text-muted">7 files analyzed · 5 findings</p>
              </div>
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">2 high</span>
            </div>
          </div>
          <div className="mt-3 grid gap-3">
            {["Hardcoded token-like secret", "Nested loop with API calls", "Broad exception swallowing"].map((finding, index) => (
              <div key={finding} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{finding}</p>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">Agent {index + 1}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">Actionable explanation, suggested fix, and exact file context prepared for human approval.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-panel/50">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
          <h2 className="text-2xl font-semibold text-foreground">How It Works</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold text-muted">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="permissions" className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Required GitHub Access</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              PRism AI needs GitHub access to read pull request context and post only the comments you approve.
            </p>
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Why Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scopes.map(([scope, why]) => (
                  <tr key={scope} className="bg-background">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{scope}</td>
                    <td className="px-4 py-3 text-muted">{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-100">
              For MVP, repo scope is required because GitHub OAuth scopes are broad. In production SaaS, PRism AI should migrate to GitHub App permissions for finer-grained repository access.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-panel/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Clerk + GitHub OAuth Setup</h2>
            <div className="mt-5 space-y-3">
              {setupSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                  <p className="text-sm leading-6 text-muted">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <InfoCard icon={LockKeyhole} title="Prerequisites" lines={["GitHub account", "Access to repository PRs", "Clerk project configured", "GitHub OAuth App configured", "OpenAI/OpenRouter key optional if BYOK is enabled"]} />
            <InfoCard icon={ShieldCheck} title="Security Model" lines={["GitHub token is used only for PR data and approved comment posting.", "AI findings are never posted automatically.", "BYOK API keys should be encrypted server-side.", "Production SaaS should use GitHub App least-privilege access."]} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <h2 className="text-2xl font-semibold text-foreground">Preview</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <PreviewCard icon={FileCode2} title="Diff Viewer" text="Review changed files and patches in a focused workspace." />
          <PreviewCard icon={Bot} title="Agent Timeline" text="Watch each AI reviewer stream progress in real time." />
          <PreviewCard icon={ShieldCheck} title="AI Findings" text="Filter findings by severity, agent, and approval status." />
          <PreviewCard icon={Timer} title="Review Summary" text="Track files analyzed, critical findings, and completion state." />
        </div>
        <div className="mt-8">
          <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-white hover:brightness-110">
              <PlayCircle className="h-4 w-4" />
              Start Reviewing PRs
            </button>
          </SignInButton>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: typeof LockKeyhole; title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-6 text-muted">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewCard({ icon: Icon, title, text }: { icon: typeof FileCode2; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}
