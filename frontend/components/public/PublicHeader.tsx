"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Bot, Github, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function PublicHeader() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/12 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">PRism AI</span>
            <span className="block text-xs text-muted">Agentic PR reviews</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-muted md:flex">
          <Link className="hover:text-foreground" href="/#how-it-works">How it works</Link>
          <Link className="hover:text-foreground" href="/#permissions">Permissions</Link>
          <Link className="hover:text-foreground" href="/setup-guide">Setup Guide</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button aria-label="Toggle theme" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-panel text-foreground hover:border-primary/60" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>
          <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:brightness-110">
              <Github className="h-4 w-4" />
              Continue with GitHub
            </button>
          </SignInButton>
        </div>
      </div>
    </header>
  );
}
