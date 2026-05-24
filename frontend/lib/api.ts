import { API_BASE_URL } from "./constants";
import type { GitHubPRInput, PRFetchResponse, ReviewResults } from "./types";

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : response.statusText;
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return data as T;
}

async function postJSON<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<TResponse>(response);
}

export function fetchPR(input: GitHubPRInput): Promise<PRFetchResponse> {
  return postJSON<PRFetchResponse, GitHubPRInput>("/github/pr/fetch", input);
}

export function runReview(input: GitHubPRInput): Promise<{ job_id: string }> {
  return postJSON<{ job_id: string }, GitHubPRInput>("/review/run", input);
}

export async function getReviewResults(jobId: string): Promise<ReviewResults> {
  const response = await fetch(`${API_BASE_URL}/review/results/${encodeURIComponent(jobId)}`);
  const data = await parseResponse<unknown>(response);

  if (Array.isArray(data)) {
    return { findings: data };
  }

  const record = (data ?? {}) as Record<string, unknown>;
  return {
    ...record,
    findings: Array.isArray(record.findings) ? record.findings : [],
  } as ReviewResults;
}

export function postReviewComment(input: GitHubPRInput, commentId: string): Promise<{ ok?: boolean; [key: string]: unknown }> {
  return postJSON("/review/comment/post", {
    ...input,
    comment_id: commentId,
  });
}

export function createReviewStream(jobId: string): EventSource {
  return new EventSource(`${API_BASE_URL}/review/stream/${encodeURIComponent(jobId)}`);
}
