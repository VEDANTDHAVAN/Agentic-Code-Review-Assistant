"use client";

import { ExternalLink, GitPullRequest } from "lucide-react";
import type { PRFetchResponse, PRMetadata as PRMetadataType } from "@/lib/types";

type PRMetadataProps = {
  pr: PRFetchResponse | null;
};

function metadataFromResponse(pr: PRFetchResponse | null): PRMetadataType | undefined {
  return pr?.metadata ?? pr?.pr_metadata;
}

export function PRMetadata({ pr }: PRMetadataProps) {
  const metadata = metadataFromResponse(pr);
  const files = pr?.files ?? pr?.changed_files ?? [];

  if (!metadata) {
    return (
      <section className="rounded-lg border border-dashed border-border bg-panel p-4 text-sm text-slate-500">
        Fetch a PR to see title, author, branches, and changed file counts.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-panel p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-cyan-300">
            <GitPullRequest className="h-4 w-4" />
            Pull request metadata
          </div>
          <h2 className="truncate text-lg font-semibold text-white">{metadata.title ?? "Untitled pull request"}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {metadata.author ? `Opened by ${metadata.author}` : "Author unavailable"} | {metadata.state ?? "unknown"} | {metadata.changed_files ?? files.length} changed file(s)
          </p>
        </div>
        {typeof metadata.html_url === "string" && metadata.html_url ? (
          <a className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10" href={metadata.html_url} target="_blank" rel="noreferrer">
            Open PR
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md border border-border bg-[#090f1b] px-3 py-1.5 text-xs text-slate-300">Base: {metadata.base_branch ?? "unknown"}</span>
        <span className="rounded-md border border-border bg-[#090f1b] px-3 py-1.5 text-xs text-slate-300">Head: {metadata.head_branch ?? "unknown"}</span>
        <span className="rounded-md border border-border bg-[#090f1b] px-3 py-1.5 text-xs text-emerald-200">+{metadata.additions ?? 0}</span>
        <span className="rounded-md border border-border bg-[#090f1b] px-3 py-1.5 text-xs text-rose-200">-{metadata.deletions ?? 0}</span>
      </div>
    </section>
  );
}
