"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FileCode2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { ChangedFile, Finding, PRFetchResponse } from "@/lib/types";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-muted">Loading diff viewer...</div>,
});

type DiffViewerProps = {
  pr: PRFetchResponse | null;
  selectedFile?: string | null;
  selectedFinding?: Finding | null;
  loading?: boolean;
  onSelectFile: (filename: string) => void;
};

function filesFromResponse(pr: PRFetchResponse | null): ChangedFile[] {
  return pr?.files ?? pr?.changed_files ?? [];
}

function patchForFile(pr: PRFetchResponse | null, file: ChangedFile | undefined): string {
  if (!file) return "";
  return file.patch ?? pr?.diffs?.[file.filename] ?? "";
}

export function DiffViewer({ pr, selectedFile, selectedFinding, loading = false, onSelectFile }: DiffViewerProps) {
  const { resolvedTheme } = useTheme();
  const [monacoFailed, setMonacoFailed] = useState(false);
  const files = filesFromResponse(pr);
  const activeFile = files.find((file) => file.filename === selectedFile) ?? files[0];
  const patch = patchForFile(pr, activeFile);
  const viewerText = patch || (activeFile ? "// GitHub did not provide patch content for this file." : "// Fetch a PR to view diff.");
  const highlightedLine = selectedFinding && activeFile && selectedFinding.file_path === activeFile.filename ? selectedFinding.line_number : null;

  return (
    <section className="flex h-[calc(100vh-236px)] min-h-[560px] flex-col overflow-hidden rounded-lg border border-border bg-panel">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Diff workspace</h2>
            <p className="mt-1 truncate text-xs text-muted">{activeFile ? activeFile.filename : loading ? "Fetching pull request..." : "Fetch a PR to view diff"}</p>
          </div>
          {highlightedLine ? <span className="shrink-0 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary">Line {highlightedLine}</span> : null}
        </div>
      </div>

      <div className="flex min-h-[52px] gap-2 overflow-x-auto border-b border-border p-2 scrollbar-thin">
        {loading ? <div className="h-9 w-52 animate-pulse rounded-md bg-panel-strong" /> : null}
        {!loading && files.length === 0 ? <span className="px-2 py-2 text-sm text-muted">No files loaded</span> : null}
        {files.map((file) => (
          <button key={file.filename} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs transition ${activeFile?.filename === file.filename ? "border-primary/70 bg-primary/10 text-primary" : "border-border bg-panel-strong text-muted hover:text-foreground"}`} onClick={() => onSelectFile(file.filename)}>
            <FileCode2 className="h-3.5 w-3.5" />
            <span className="max-w-64 truncate">{file.filename}</span>
            <span className="text-success">+{file.additions ?? 0}</span>
            <span className="text-danger">-{file.deletions ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {monacoFailed ? (
          <pre className="h-full overflow-auto bg-background p-4 font-mono text-xs leading-5 text-foreground scrollbar-thin">{viewerText}</pre>
        ) : (
          <Editor
            key={`${activeFile?.filename ?? "empty"}-${highlightedLine ?? "none"}`}
            height="100%"
            width="100%"
            language="diff"
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={viewerText}
            beforeMount={() => setMonacoFailed(false)}
            onMount={(editor) => {
              if (highlightedLine) {
                editor.revealLineInCenter(highlightedLine);
              }
            }}
            onValidate={() => setMonacoFailed(false)}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              glyphMargin: true,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              renderLineHighlight: "all",
              automaticLayout: true,
            }}
            className="h-full w-full"
            loading={<div className="flex h-full items-center justify-center text-sm text-muted">Starting Monaco...</div>}
            keepCurrentModel={false}
            path={activeFile?.filename ?? "empty.diff"}
            saveViewState
            defaultValue={viewerText}
          />
        )}
      </div>
    </section>
  );
}
