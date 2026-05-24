export type ReviewStatus = "idle" | "fetching" | "ready" | "running" | "completed" | "failed";

export type GitHubPRInput = {
  github_token?: string;
  user_id?: string;
  owner: string;
  repo: string;
  pr_number: number;
};

export type PRMetadata = {
  title?: string;
  author?: string;
  state?: string;
  html_url?: string;
  base_branch?: string;
  head_branch?: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  [key: string]: unknown;
};

export type ChangedFile = {
  filename: string;
  status?: string;
  additions?: number;
  deletions?: number;
  changes?: number;
  patch?: string;
  raw_url?: string | null;
  blob_url?: string | null;
  [key: string]: unknown;
};

export type PRFetchResponse = {
  pr_metadata?: PRMetadata;
  metadata?: PRMetadata;
  files?: ChangedFile[];
  changed_files?: ChangedFile[];
  diffs?: Record<string, string>;
  [key: string]: unknown;
};

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Finding = {
  id: string;
  agent?: string | null;
  file_path?: string | null;
  line_number?: number | null;
  severity?: Severity | string;
  title?: string;
  explanation?: string;
  suggestion?: string;
  code_snippet?: string | null;
  approved?: boolean;
  posted?: boolean;
  status?: "pending" | "approved" | "rejected" | "posted";
  [key: string]: unknown;
};

export type ReviewLogEvent = {
  id?: string | number;
  type?: string;
  message?: string;
  agent?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  [key: string]: unknown;
};

export type ReviewResults = {
  findings: Finding[];
  summary?: string | null;
  job?: {
    id?: string;
    status?: string;
    [key: string]: unknown;
  };
  logs?: ReviewLogEvent[];
  [key: string]: unknown;
};

export type ApiError = {
  message: string;
  status?: number;
};

export type RecentReview = {
  job_id: string;
  owner: string;
  repo: string;
  pr_number: number;
  title: string;
  completed_at: string;
  findings_count: number;
  status: string;
  results?: ReviewResults;
  pr?: PRFetchResponse | null;
};

export type AgentToast = {
  id: string;
  title: string;
  message: string;
  kind: "info" | "success" | "warning" | "error";
};

export type GitHubUser = {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
  html_url?: string | null;
};

export type AuthState = {
  authenticated: boolean;
  user: GitHubUser | null;
};

export type RepositorySummary = {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  private: boolean;
  visibility: string;
  language?: string | null;
  updated_at?: string | null;
  open_pr_count: number;
  html_url?: string | null;
};

export type PullRequestSummary = {
  number: number;
  title: string;
  author: string;
  state: string;
  html_url: string;
  base_branch: string;
  head_branch: string;
  changed_files: number;
  additions: number;
  deletions: number;
  ci_status?: string | null;
};

export type GitHubPermissionStatus = {
  scopes: string[];
  has_repo_scope: boolean;
  can_post_comments: boolean;
  warnings: string[];
};

export type AIProviderName = "openai" | "openrouter";

export type UserAIKeyPublic = {
  provider: AIProviderName;
  masked_key: string;
  default_model: string;
  connected: boolean;
  updated_at: string;
};
