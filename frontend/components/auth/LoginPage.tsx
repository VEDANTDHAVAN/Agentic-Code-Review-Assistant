"use client";

import { SignInButton } from "@clerk/nextjs";
import { Github } from "lucide-react";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-panel p-8 shadow-2xl shadow-black/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Github className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">AI Pull Request Review Workspace</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sign in with GitHub through Clerk to review pull requests in real time and publish approved AI review comments.
        </p>
        <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
          <button className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:brightness-110">
            <Github className="h-4 w-4" />
            Continue with GitHub
          </button>
        </SignInButton>
        <p className="mt-4 text-xs leading-5 text-muted">
          Configure Clerk with GitHub as a social connection. Manual token fallback is still available in the review form for development.
        </p>
      </section>
    </main>
  );
}
