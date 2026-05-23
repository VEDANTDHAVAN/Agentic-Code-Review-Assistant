"use client";

import { GitBranch, Github, Play, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { GitHubInput } from "@/lib/types";

type Props = {
  initial: GitHubInput;
  loading: boolean;
  onFetch: (input: GitHubInput) => void;
  onRun: (input: GitHubInput) => void;
};

export function GitHubForm({ initial, loading, onFetch, onRun }: Props) {
  const [form, setForm] = useState<GitHubInput>(initial);

  function submit(event: FormEvent, action: "fetch" | "run") {
    event.preventDefault();
    submitAction(action);
  }

  function submitAction(action: "fetch" | "run") {
    const normalized = { ...form, pr_number: Number(form.pr_number) || 1 };
    if (action === "fetch") onFetch(normalized);
    else onRun(normalized);
  }

  return (
    <form className="grid gap-3 rounded-lg border border-border bg-white p-4 shadow-panel lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.45fr_auto_auto]" onSubmit={(event) => submit(event, "fetch")}>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        GitHub PAT
        <div className="relative">
          <Github className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="h-10 w-full rounded-md border border-border bg-slate-50 pl-9 pr-3 outline-none focus:border-primary" placeholder="optional for demo" type="password" value={form.github_token ?? ""} onChange={(event) => setForm({ ...form, github_token: event.target.value })} />
        </div>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Owner
        <input className="h-10 rounded-md border border-border bg-slate-50 px-3 outline-none focus:border-primary" value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Repo
        <div className="relative">
          <GitBranch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className="h-10 w-full rounded-md border border-border bg-slate-50 pl-9 pr-3 outline-none focus:border-primary" value={form.repo} onChange={(event) => setForm({ ...form, repo: event.target.value })} />
        </div>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        PR
        <input className="h-10 rounded-md border border-border bg-slate-50 px-3 outline-none focus:border-primary" min={1} type="number" value={form.pr_number} onChange={(event) => setForm({ ...form, pr_number: Number(event.target.value) })} />
      </label>
      <button className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={loading} type="submit">
        <Search className="h-4 w-4" /> Fetch
      </button>
      <button className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50" disabled={loading} type="button" onClick={() => submitAction("run")}>
        <Play className="h-4 w-4" /> Run Review
      </button>
    </form>
  );
}
