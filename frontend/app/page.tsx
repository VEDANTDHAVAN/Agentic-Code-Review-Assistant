"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentGraph } from "@/components/AgentGraph";
import { AgentTimeline } from "@/components/AgentTimeline";
import { DiffViewer } from "@/components/DiffViewer";
import { FindingsPanel } from "@/components/FindingsPanel";
import { GitHubForm } from "@/components/GitHubForm";
import { API_BASE, fetchPr, getResults, postComment, runReview, setApproval } from "@/lib/api";
import { Finding, GitHubInput, LogEvent, PRFetchResponse } from "@/lib/types";

const initialInput: GitHubInput = { github_token: "", owner: "demo", repo: "agentic-demo", pr_number: 1 };

export default function Home() {
  const [input, setInput] = useState<GitHubInput>(initialInput);
  const [pr, setPr] = useState<PRFetchResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAgent = useMemo(() => [...logs].reverse().find((log) => log.agent?.endsWith("Agent"))?.agent ?? null, [logs]);

  async function handleFetch(nextInput: GitHubInput) {
    setLoading(true);
    setError(null);
    setInput(nextInput);
    try {
      const response = await fetchPr(nextInput);
      setPr(response);
      setSelectedFile(response.files[0]?.filename ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch PR");
    } finally {
      setLoading(false);
    }
  }

  async function handleRun(nextInput: GitHubInput) {
    setLoading(true);
    setError(null);
    setLogs([]);
    setFindings([]);
    setSummary(null);
    setInput(nextInput);
    try {
      const [prResponse, runResponse] = await Promise.all([fetchPr(nextInput), runReview(nextInput)]);
      setPr(prResponse);
      setSelectedFile(prResponse.files[0]?.filename ?? null);
      setJobId(runResponse.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start review");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;
    const source = new EventSource(`${API_BASE}/review/stream/${jobId}`);
    source.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "stream_closed") {
        source.close();
        const results = await getResults(jobId);
        setFindings(results.findings);
        setSummary(results.summary ?? null);
        setLoading(false);
        return;
      }
      setLogs((current) => [...current, data]);
      if (data.type === "finding" && data.metadata?.id) {
        setFindings((current) => [...current, data.metadata as Finding]);
      }
      if (data.type === "summary" && data.metadata?.summary) {
        setSummary(String(data.metadata.summary));
      }
    };
    source.onerror = () => {
      source.close();
      setError("Live stream disconnected. Results may still be available.");
      setLoading(false);
    };
    return () => source.close();
  }, [jobId]);

  async function handleApprove(finding: Finding, approved: boolean) {
    await setApproval(finding.id, approved);
    setFindings((current) => current.map((item) => (item.id === finding.id ? { ...item, approved } : item)));
  }

  async function handlePost(finding: Finding) {
    try {
      await postComment(input, finding);
      setFindings((current) => current.map((item) => (item.id === finding.id ? { ...item, posted: true } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post comment");
    }
  }

  async function handlePostApproved() {
    for (const finding of findings.filter((item) => item.approved && !item.posted)) {
      await handlePost(finding);
    }
  }

  return (
    <main className="min-h-screen p-4 text-slate-800 lg:p-6">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-normal">Agentic Code Review Assistant</h1>
              <p className="mt-1 text-sm text-slate-600">Review GitHub PR diffs with modular agents, approve comments, then post them when ready.</p>
            </div>
            {jobId ? <span className="rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-slate-600">Job {jobId.slice(0, 8)}</span> : null}
          </div>
          <GitHubForm initial={initialInput} loading={loading} onFetch={handleFetch} onRun={handleRun} />
          {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
          {pr ? (
            <div className="rounded-lg border border-border bg-white p-3 shadow-panel">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{pr.pr_metadata.title}</span>
                <span className="text-slate-500">by {pr.pr_metadata.author}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs">{pr.pr_metadata.base_branch} &lt;- {pr.pr_metadata.head_branch}</span>
              </div>
              {summary ? <p className="mt-2 text-sm text-slate-600">{summary}</p> : null}
            </div>
          ) : null}
        </header>
        <div className="grid gap-4 xl:grid-cols-[1.05fr_1.1fr_0.85fr]">
          <DiffViewer pr={pr} selected={selectedFile} onSelect={setSelectedFile} />
          <FindingsPanel findings={findings} loading={loading} onApprove={handleApprove} onPost={handlePost} onPostApproved={handlePostApproved} />
          <AgentTimeline logs={logs} />
        </div>
        <AgentGraph activeAgent={activeAgent} />
      </div>
    </main>
  );
}
