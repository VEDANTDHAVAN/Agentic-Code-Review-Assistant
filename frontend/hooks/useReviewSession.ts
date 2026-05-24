"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createReviewStream, fetchPR, getReviewResults, postReviewComment, runReview, updateFindingApproval } from "@/lib/api";
import { AGENT_PIPELINE, SEVERITY_ORDER } from "@/lib/constants";
import type { AgentToast, ChangedFile, Finding, GitHubPRInput, PRFetchResponse, ReviewLogEvent, ReviewStatus } from "@/lib/types";
import { useRecentReviews } from "./useRecentReviews";

const initialInput: GitHubPRInput = { github_token: "", owner: "", repo: "", pr_number: 1 };

function filesFromResponse(pr: PRFetchResponse | null): ChangedFile[] {
  return pr?.files ?? pr?.changed_files ?? [];
}

function metadataTitle(pr: PRFetchResponse | null) {
  return pr?.metadata?.title ?? pr?.pr_metadata?.title ?? "Untitled pull request";
}

function sortFindings(findings: Finding[]) {
  return [...findings].sort((a, b) => {
    const left = SEVERITY_ORDER[String(a.severity ?? "info").toLowerCase() as keyof typeof SEVERITY_ORDER] ?? 0;
    const right = SEVERITY_ORDER[String(b.severity ?? "info").toLowerCase() as keyof typeof SEVERITY_ORDER] ?? 0;
    return right - left;
  });
}

function importantToast(event: ReviewLogEvent): AgentToast | null {
  const type = String(event.type ?? "").toLowerCase();
  const agent = event.agent ?? "Pipeline";
  const message = event.message ?? "Agent event received";
  if (!(type.includes("start") || type.includes("completed") || type.includes("finding") || type.includes("error") || type.includes("summary"))) return null;
  return {
    id: `${Date.now()}-${agent}-${type}`,
    title: agent,
    message,
    kind: type.includes("error") ? "error" : type.includes("completed") ? "success" : type.includes("finding") ? "warning" : "info",
  };
}

export function useReviewSession() {
  const { addReview } = useRecentReviews();
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
  const [toasts, setToasts] = useState<AgentToast[]>([]);
  const [lastEventMessage, setLastEventMessage] = useState<string | null>(null);

  const activeAgent = useMemo(() => [...events].reverse().find((event) => event.agent)?.agent ?? null, [events]);
  const completedAgents = useMemo(() => new Set(events.filter((event) => String(event.type ?? "").toLowerCase().includes("completed")).map((event) => event.agent).filter(Boolean) as string[]), [events]);
  const erroredAgents = useMemo(() => new Set(events.filter((event) => String(event.type ?? "").toLowerCase().includes("error")).map((event) => event.agent).filter(Boolean) as string[]), [events]);
  const loading = status === "fetching" || status === "running";

  const addToast = useCallback((toast: AgentToast) => {
    setToasts((current) => {
      const duplicate = current.some((item) => item.title === toast.title && item.message === toast.message);
      if (duplicate) return current;
      return [toast, ...current].slice(0, 4);
    });
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 4200);
  }, []);

  const finishRun = useCallback(async (runJobId: string) => {
    const results = await getReviewResults(runJobId);
    setFindings(sortFindings(results.findings ?? []));
    setStatus("completed");
    setApiStatus("connected");
    addReview({
      job_id: runJobId,
      owner: input.owner,
      repo: input.repo,
      pr_number: input.pr_number,
      title: metadataTitle(pr),
      completed_at: new Date().toISOString(),
      findings_count: results.findings?.length ?? 0,
      status: results.job?.status ?? "completed",
      results,
      pr,
    });
  }, [addReview, input.owner, input.pr_number, input.repo, pr]);

  async function handleFetch(nextInput: GitHubPRInput) {
    setInput(nextInput);
    setError(null);
    setStatus("fetching");
    try {
      const response = await fetchPR(nextInput);
      setPr(response);
      setApiStatus("connected");
      setStatus("ready");
      setSelectedFile(filesFromResponse(response)[0]?.filename ?? null);
      addToast({ id: `fetch-${Date.now()}`, title: "PR loaded", message: metadataTitle(response), kind: "success" });
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
      setSelectedFile(filesFromResponse(prResponse)[0]?.filename ?? null);
      addToast({ id: `run-${Date.now()}`, title: "Review started", message: "Agent pipeline is running", kind: "info" });
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
          await finishRun(jobId);
          return;
        }
        setEvents((current) => [...current, event]);
        setLastEventMessage(event.message ?? null);
        const toast = importantToast(event);
        if (toast) addToast(toast);

        const possibleFinding = event.metadata as Finding | undefined;
        if (String(event.type ?? "").toLowerCase().includes("finding") && possibleFinding?.id) {
          setFindings((current) => sortFindings([...current.filter((item) => item.id !== possibleFinding.id), possibleFinding]));
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
  }, [addToast, finishRun, jobId, status]);

  async function approveFinding(id: string, approved: boolean) {
    const previousFindings = findings;
    const previousSelected = selectedFinding;
    setError(null);
    setFindings((current) => current.map((finding) => (finding.id === id ? { ...finding, approved } : finding)));
    setSelectedFinding((current) => (current?.id === id ? { ...current, approved } : current));
    try {
      await updateFindingApproval(id, approved);
      setApiStatus("connected");
    } catch (err) {
      setFindings(previousFindings);
      setSelectedFinding(previousSelected);
      setApiStatus("error");
      setError(err instanceof Error ? err.message : "Failed to update finding approval.");
    }
  }

  async function approveAllSafe() {
    const safe = findings.filter((finding) => !finding.posted && ["low", "medium"].includes(String(finding.severity ?? "").toLowerCase()));
    for (const finding of safe) await approveFinding(finding.id, true);
  }

  function selectFinding(finding: Finding) {
    setSelectedFinding(finding);
    if (finding.file_path) setSelectedFile(finding.file_path);
  }

  async function postApproved() {
    const queue = findings.filter((finding) => finding.approved && !finding.posted);
    if (queue.length === 0) return;
    setPosting(true);
    setError(null);
    try {
      for (const finding of queue) {
        await updateFindingApproval(finding.id, true);
        await postReviewComment(input, finding.id);
        setFindings((current) => current.map((item) => (item.id === finding.id ? { ...item, posted: true } : item)));
      }
      setApiStatus("connected");
      addToast({ id: `post-${Date.now()}`, title: "Comments posted", message: `${queue.length} approved comment(s) sent to GitHub`, kind: "success" });
    } catch (err) {
      setApiStatus("error");
      setError(err instanceof Error ? err.message : "Failed to post approved comments.");
    } finally {
      setPosting(false);
    }
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return {
    input,
    pr,
    jobId,
    status,
    apiStatus,
    events,
    findings,
    selectedFile,
    selectedFinding,
    error,
    posting,
    toasts,
    activeAgent,
    completedAgents,
    erroredAgents,
    loading,
    lastEventMessage,
    totalAgents: AGENT_PIPELINE.length,
    setSelectedFile,
    handleFetch,
    handleRun,
    approveFinding,
    approveAllSafe,
    selectFinding,
    postApproved,
    dismissToast,
  };
}
