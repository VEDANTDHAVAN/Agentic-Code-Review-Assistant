"use client";

import Editor from "@monaco-editor/react";
import { FileCode2 } from "lucide-react";
import { ChangedFile, PRFetchResponse } from "@/lib/types";

type Props = {
  pr?: PRFetchResponse | null;
  selected?: string | null;
  onSelect: (file: string) => void;
};

export function DiffViewer({ pr, selected, onSelect }: Props) {
  const files = pr?.files ?? [];
  const active: ChangedFile | undefined = files.find((file) => file.filename === selected) ?? files[0];

  return (
    <section className="flex min-h-[580px] flex-col rounded-lg border border-border bg-white shadow-panel">
      <div className="border-b border-border p-3">
        <h2 className="text-sm font-semibold">Changed files</h2>
        <p className="mt-1 text-xs text-slate-500">{pr ? `${files.length} file(s), ${pr.from_mock ? "mock data" : "GitHub data"}` : "Fetch a PR to inspect diffs."}</p>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[150px_1fr]">
        <div className="overflow-auto border-b border-border p-2">
          {files.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No files loaded</div>
          ) : (
            files.map((file) => (
              <button key={file.filename} className={`mb-2 flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm ${active?.filename === file.filename ? "border-primary bg-cyan-50" : "border-border bg-white hover:bg-slate-50"}`} onClick={() => onSelect(file.filename)}>
                <FileCode2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{file.filename}</span>
                <span className="text-xs text-emerald-700">+{file.additions}</span>
                <span className="text-xs text-rose-700">-{file.deletions}</span>
              </button>
            ))
          )}
        </div>
        <div className="min-h-0">
          <Editor height="100%" defaultLanguage="diff" theme="vs-light" value={active?.patch ?? "// Diff output will appear here after fetching a PR."} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: "on", scrollBeyondLastLine: false }} />
        </div>
      </div>
    </section>
  );
}
