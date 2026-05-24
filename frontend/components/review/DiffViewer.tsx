"use client";

import Editor from "@monaco-editor/react";
import { FileCode2 } from "lucide-react";
import type { ChangedFile, Finding, PRFetchResponse } from "@/lib/types";

type DiffViewerProps = {
  pr: PRFetchResponse | null;
  selectedFile?: string | null;
  selectedFinding?: Finding | null;
  onSelectFile: (filename: string) => void;
};

function filesFromResponse(pr: PRFetchResponse | null): ChangedFile[] {
  return pr?.files ?? pr?.changed_files ?? [];
}

function patchForFile(pr: PRFetchResponse | null, file: ChangedFile | undefined): string {
  if (!file) return "";
  return file.patch ?? pr?.diffs?.[file.filename] ?? "";
}

export function DiffViewer({ pr, selectedFile, selectedFinding, onSelectFile }: DiffViewerProps) {
  const files = filesFromResponse(pr);
  const activeFile = files.find((file) => file.filename === selectedFile) ?? files[0];
  const patch = patchForFile(pr, activeFile);

  return (
    <section className="flex min-h-[560px] flex-col rounded-lg border border-border bg-panel">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Diff viewer</h2>
            <p className="mt-1 text-xs text-slate-500">{activeFile ? activeFile.filename : "Fetch a PR to inspect changed files."}</p>
          </div>
          {selectedFinding?.line_number ? <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">Selected line {selectedFinding.line_number}</span> : null}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-border p-2 scrollbar-thin">
        {files.length === 0 ? <span className="px-2 py-1 text-sm text-slate-500">No files loaded</span> : null}
        {files.map((file) => (
          <button key={file.filename} className={`inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs ${activeFile?.filename === file.filename ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-100" : "border-border bg-white/5 text-slate-400 hover:bg-white/10"}`} onClick={() => onSelectFile(file.filename)}>
            <FileCode2 className="h-3.5 w-3.5" />
            <span className="max-w-52 truncate">{file.filename}</span>
            <span className="text-emerald-300">+{file.additions ?? 0}</span>
            <span className="text-rose-300">-{file.deletions ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language="diff"
          theme="vs-dark"
          value={patch || "// Diff content will appear here."}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            renderLineHighlight: "all",
          }}
        />
      </div>
    </section>
  );
}
