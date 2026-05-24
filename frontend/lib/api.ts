import { API_BASE_URL } from "./constants";
import type { AIProviderName, AuthState, GitHubPermissionStatus, GitHubPRInput, PRFetchResponse, PullRequestSummary, RepositorySummary, ReviewResults, UserAIKeyPublic } from "./types";

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
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResponse<TResponse>(response);
}

async function getClerkGitHubToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/github-token", { credentials: "include" });
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

async function withGithubToken(input: GitHubPRInput): Promise<GitHubPRInput> {
  if (input.github_token) return input;
  const token = await getClerkGitHubToken();
  return token ? { ...input, github_token: token } : input;
}

export function fetchPR(input: GitHubPRInput): Promise<PRFetchResponse> {
  return withGithubToken(input).then((payload) => postJSON<PRFetchResponse, GitHubPRInput>("/github/pr/fetch", payload));
}

export function runReview(input: GitHubPRInput): Promise<{ job_id: string }> {
  return withGithubToken(input).then((payload) => postJSON<{ job_id: string }, GitHubPRInput>("/review/run", payload));
}

export async function getReviewResults(jobId: string): Promise<ReviewResults> {
  const response = await fetch(`${API_BASE_URL}/review/results/${encodeURIComponent(jobId)}`, { credentials: "include" });
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
  return withGithubToken(input).then((payload) =>
    postJSON("/review/comment/post", {
      ...payload,
      comment_id: commentId,
    }),
  );
}

export async function updateFindingApproval(findingId: string, approved: boolean): Promise<{ ok?: boolean; approved?: boolean; [key: string]: unknown }> {
  const response = await fetch(`${API_BASE_URL}/review/findings/${encodeURIComponent(findingId)}/approval`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });

  return parseResponse(response);
}

export async function updateFindingStatus(findingId: string, status: "approved" | "rejected"): Promise<{ ok?: boolean; status?: string; [key: string]: unknown }> {
  const response = await fetch(`${API_BASE_URL}/review/finding/status`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ finding_id: findingId, status }),
  });

  return parseResponse(response);
}

export function createReviewStream(jobId: string): EventSource {
  return new EventSource(`${API_BASE_URL}/review/stream/${encodeURIComponent(jobId)}`);
}

export async function getAuthMe(): Promise<AuthState> {
  const response = await fetch(`${API_BASE_URL}/auth/github/me`, { credentials: "include" });
  return parseResponse<AuthState>(response);
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
  await parseResponse(response);
}

export async function listRepositories(): Promise<RepositorySummary[]> {
  const token = await getClerkGitHubToken();
  const response = await fetch(`${API_BASE_URL}/github/repositories`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await parseResponse<{ repositories?: RepositorySummary[] }>(response);
  return data.repositories ?? [];
}

export async function listPullRequests(owner: string, repo: string): Promise<PullRequestSummary[]> {
  const token = await getClerkGitHubToken();
  const response = await fetch(`${API_BASE_URL}/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await parseResponse<{ pull_requests?: PullRequestSummary[] }>(response);
  return data.pull_requests ?? [];
}

export async function checkGitHubPermissions(): Promise<GitHubPermissionStatus> {
  const token = await getClerkGitHubToken();
  const response = await fetch(`${API_BASE_URL}/github/permissions/check`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return parseResponse<GitHubPermissionStatus>(response);
}

function userHeaders(userId: string) {
  return { "Content-Type": "application/json", "X-Prism-User-Id": userId };
}

export async function listAIKeys(userId: string): Promise<UserAIKeyPublic[]> {
  const response = await fetch(`${API_BASE_URL}/user/ai-keys`, { headers: { "X-Prism-User-Id": userId } });
  return parseResponse<UserAIKeyPublic[]>(response);
}

export async function saveAIKey(userId: string, payload: { provider: AIProviderName; api_key: string; default_model: string }) {
  const response = await fetch(`${API_BASE_URL}/user/ai-keys`, {
    method: "POST",
    headers: userHeaders(userId),
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function testAIKey(payload: { provider: AIProviderName; api_key: string; default_model: string }): Promise<{ valid: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/user/ai-keys/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function deleteAIKey(userId: string, provider: AIProviderName) {
  const response = await fetch(`${API_BASE_URL}/user/ai-keys/${provider}`, {
    method: "DELETE",
    headers: { "X-Prism-User-Id": userId },
  });
  return parseResponse(response);
}
