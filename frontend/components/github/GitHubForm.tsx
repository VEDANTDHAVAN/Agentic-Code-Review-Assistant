"use client";

import { FormEvent, useState } from "react";
import { GitBranch, Github, Play, Search } from "lucide-react";
import type { GitHubPRInput } from "@/lib/types";

type GitHubFormProps = {
  initialInput: GitHubPRInput;
  loading: boolean;
  onFetch: (input: GitHubPRInput) => void;
  onRun: (input: GitHubPRInput) => void;
};

export function GitHubForm({ initialInput, loading, onFetch, onRun }: GitHubFormProps) {
  const [input, setInput] = useState<GitHubPRInput>(initialInput);
  const [validationError, setValidationError] = useState<string | null>(null);

  function normalize(): GitHubPRInput | null {
    const owner = input.owner.trim();
    const repo = input.repo.trim();
    const prNumber = Number(input.pr_number);

    if (!owner || !repo || !Number.isFinite(prNumber) || prNumber < 1) {
      setValidationError("Owner, repo, and a valid PR number are required.");
      return null;
    }

    setValidationError(null);
    return {
      github_token: input.github_token?.trim() || undefined,
      owner,
      repo,
      pr_number: prNumber,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalize();
    if (normalized) onFetch(normalized);
  }

  function handleRun() {
    const normalized = normalize();
    if (normalized) onRun(normalized);
  }

  return (
    <section className="rounded-lg border border-border bg-panel p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">GitHub pull request</h2>
          <p className="mt-1 text-xs text-slate-400">Token is kept in memory only for this session.</p>
        </div>
        <Github className="h-5 w-5 text-slate-500" />
      </div>

      <form className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.9fr_0.45fr_auto_auto]" onSubmit={handleSubmit}>
        <label className="space-y-1.5 text-xs font-medium text-slate-400">
          GitHub token
          <input
            className="h-10 w-full rounded-md border border-border bg-[#090f1b] px-3 text-sm text-white outline-none transition focus:border-cyan-400/70"
            placeholder="ghp_... or leave empty"
            type="password"
            value={input.github_token ?? ""}
            onChange={(event) => setInput((current) => ({ ...current, github_token: event.target.value }))}
          />
        </label>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">
          Owner
          <input
            className="h-10 w-full rounded-md border border-border bg-[#090f1b] px-3 text-sm text-white outline-none transition focus:border-cyan-400/70"
            placeholder="openai"
            value={input.owner}
            onChange={(event) => setInput((current) => ({ ...current, owner: event.target.value }))}
          />
        </label>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">
          Repository
          <div className="relative">
            <GitBranch className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
            <input
              className="h-10 w-full rounded-md border border-border bg-[#090f1b] pl-9 pr-3 text-sm text-white outline-none transition focus:border-cyan-400/70"
              placeholder="repo"
              value={input.repo}
              onChange={(event) => setInput((current) => ({ ...current, repo: event.target.value }))}
            />
          </div>
        </label>

        <label className="space-y-1.5 text-xs font-medium text-slate-400">
          PR
          <input
            className="h-10 w-full rounded-md border border-border bg-[#090f1b] px-3 text-sm text-white outline-none transition focus:border-cyan-400/70"
            min={1}
            type="number"
            value={input.pr_number}
            onChange={(event) => setInput((current) => ({ ...current, pr_number: Number(event.target.value) }))}
          />
        </label>

        <button className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white/5 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading} type="submit">
          <Search className="h-4 w-4" />
          Fetch PR
        </button>

        <button className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading} type="button" onClick={handleRun}>
          <Play className="h-4 w-4" />
          Run Review
        </button>
      </form>

      {validationError ? <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{validationError}</p> : null}
    </section>
  );
}
