"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentGraph } from "@/components/agents/AgentGraph";
import { AgentTimeline } from "@/components/agents/AgentTimeline";
import { ContextInspector } from "@/components/context/ContextInspector";
import { GitHubForm } from "@/components/github/GitHubForm";
import { PRMetadata } from "@/components/github/PRMetadata";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DiffViewer } from "@/components/review/DiffViewer";
import { FindingsPanel } from "@/components/review/FindingsPanel";
import { createReviewStream, fetchPR, getReviewResults, postReviewComment, runReview } from "@/lib/api";
import { SEVERITY_ORDER } from "@/lib/constants";
import type { Finding, GitHubPRInput, PRFetchResponse, ReviewLogEvent, ReviewStatus } from "@/lib/types";

const initialInput: GitHubPRInput = {
  github_token: "",
  owner: "",
  repo: "",
  pr_number: 1,
};

function filesFromResponse(pr: PRFetchResponse | null) {
  return pr?.files ?? pr?.changed_files ?? [];
}

function isCompletionEvent(event: ReviewLogEvent) {
  const type = String(event.type ?? "").toLowerCase();
  const message = String(event.message ?? "").toLowerCase();
  return type.includes("completed") || type.includes("done") || type.includes("stream_closed") || message.includes("review completed");
}

function sortFindings(findings: Finding[]) {
  return [...findings].sort((a, b) => {
    const left = SEVERITY_ORDER[String(a.severity ?? "info").toLowerCase() as keyof typeof SEVERITY_ORDER] ?? 0;
    const right = SEVERITY_ORDER[String(b.severity ?? "info").toLowerCase() as keyof typeof SEVERITY_ORDER] ?? 0;
    return right - left;
  });
}

export default function Home() {
  const [input, setInput] = useState<GitHubPRInput>(initialInput);
  const [pr, setPr] = useState<PRFetchResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("idle");
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "error">("unknown");
  const [events, setEvents] = useState<ReviewLogEvent[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const activeAgent = useMemo(() => [...events].reverse().find((event) => event.agent)?.agent ?? null, [events]);
  const loading = status === "fetching" || status === "running";

  async function handleFetch(nextInput: GitHubPRInput) {
    setInput(nextInput);
    setError(null);
    setStatus("fetching");

    try {
      const response = await fetchPR(nextInput);
      setPr(response);
      setApiStatus("connected");
      setStatus("ready");
      const files = filesFromResponse(response);
      setSelectedFile(files[0]?.filename ?? null);
    } catch (err) {
      setApiStatus("error");
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Failed to fetch pull request.");
    }
  }

  async function handleRun(nextInput: GitHubPRInput) {
    setInput(nextInput);
    setError(null);
    setEvents([]);
    setFindings([]);
    setSelectedFinding(null);
    setStatus("running");

    try {
      const [prResponse, runResponse] = await Promise.all([fetchPR(nextInput), runReview(nextInput)]);
      setPr(prResponse);
      setApiStatus("connected");
      setJobId(runResponse.job_id);
      const files = filesFromResponse(prResponse);
      setSelectedFile(files[0]?.filename ?? null);
    } catch (err) {
      setApiStatus("error");
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Failed to start review.");
    }
  }

  useEffect(() => {
    if (!jobId) return;

    const source = createReviewStream(jobId);

    source.onmessage = async (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as ReviewLogEvent;

        if (String(event.type ?? "").toLowerCase() === "stream_closed") {
          source.close();
          const results = await getReviewResults(jobId);
          setFindings(sortFindings(results.findings ?? []));
          setStatus("completed");
          setApiStatus("connected");
          return;
        }

        setEvents((current) => [...current, event]);

        const possibleFinding = event.metadata as Finding | undefined;
        if (String(event.type ?? "").toLowerCase().includes("finding") && possibleFinding?.id) {
          setFindings((current) => sortFindings([...current.filter((item) => item.id !== possibleFinding.id), possibleFinding]));
        }

        if (isCompletionEvent(event)) {
          const results = await getReviewResults(jobId);
          setFindings(sortFindings(results.findings ?? []));
          setStatus("completed");
        }
      } catch {
        setError("Received an unreadable stream event.");
      }
    };

    source.onerror = () => {
      source.close();
      if (status === "running") {
        setStatus("failed");
        setApiStatus("error");
        setError("Review stream disconnected. Try fetching results again after the backend finishes.");
      }
    };

    return () => source.close();
  }, [jobId, status]);

  function handleApproveFinding(id: string, approved: boolean) {
    setFindings((current) => current.map((finding) => (finding.id === id ? { ...finding, approved } : finding)));
    setSelectedFinding((current) => (current?.id === id ? { ...current, approved } : current));
  }

  function handleSelectFinding(finding: Finding) {
    setSelectedFinding(finding);
    if (finding.file_path) setSelectedFile(finding.file_path);
  }

  async function handlePostApproved() {
    const queue = findings.filter((finding) => finding.approved && !finding.posted);
    if (queue.length === 0) return;

    setPosting(true);
    setError(null);

    try {
      for (const finding of queue) {
        await postReviewComment(input, finding.id);
        setFindings((current) => current.map((item) => (item.id === finding.id ? { ...item, posted: true } : item)));
      }
      setApiStatus("connected");
    } catch (err) {
      setApiStatus("error");
      setError(err instanceof Error ? err.message : "Failed to post approved comments.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header status={status} apiStatus={apiStatus} jobId={jobId} />

          <div className="space-y-4 p-4 md:p-6">
            <GitHubForm initialInput={initialInput} loading={loading || posting} onFetch={handleFetch} onRun={handleRun} />

            {error ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.95fr)]">
              <div className="space-y-4">
                <PRMetadata pr={pr} />
                <DiffViewer pr={pr} selectedFile={selectedFile} selectedFinding={selectedFinding} onSelectFile={setSelectedFile} />
              </div>

              <div className="space-y-4">
                <FindingsPanel findings={findings} selectedFindingId={selectedFinding?.id} loading={status === "running"} posting={posting} onSelectFinding={handleSelectFinding} onApproveFinding={handleApproveFinding} onPostApproved={handlePostApproved} />
                <ContextInspector
                  state={{
                    job_id: jobId,
                    active_agent: activeAgent,
                    current_status: status,
                    events_count: events.length,
                    findings_count: findings.length,
                    selected_file: selectedFile,
                    selected_finding: selectedFinding?.id ?? null,
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <AgentGraph activeAgent={activeAgent} events={events} />
              <AgentTimeline events={events} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
