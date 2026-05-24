export type ReviewStatus = "idle" | "fetching" | "ready" | "running" | "completed" | "failed";

export type GitHubPRInput = {
  github_token?: string;
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
