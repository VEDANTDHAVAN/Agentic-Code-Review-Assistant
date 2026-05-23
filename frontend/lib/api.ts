import { Finding, GitHubInput, PRFetchResponse, ReviewResults } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchPr(input: GitHubInput) {
  return request<PRFetchResponse>("/github/pr/fetch", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function runReview(input: GitHubInput) {
  return request<{ job_id: string }>("/review/run", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getResults(jobId: string) {
  return request<ReviewResults>(`/review/results/${jobId}`);
}

export function setApproval(findingId: string, approved: boolean) {
  return request<{ ok: boolean }>(`/review/findings/${findingId}/approval`, {
    method: "PATCH",
    body: JSON.stringify({ approved }),
  });
}

export function postComment(input: GitHubInput, finding: Finding) {
  return request<{ ok: boolean }>("/review/comment/post", {
    method: "POST",
    body: JSON.stringify({ ...input, comment_id: finding.id }),
  });
}
