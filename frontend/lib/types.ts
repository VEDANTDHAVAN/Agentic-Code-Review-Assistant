export type GitHubInput = {
  github_token?: string;
  owner: string;
  repo: string;
  pr_number: number;
};

export type PRMetadata = {
  title: string;
  author: string;
  state: string;
  html_url: string;
  base_branch: string;
  head_branch: string;
};

export type ChangedFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
};

export type PRFetchResponse = {
  pr_metadata: PRMetadata;
  files: ChangedFile[];
  diffs: Record<string, string>;
  from_mock: boolean;
};

export type Finding = {
  id: string;
  agent: string;
  file_path?: string | null;
  line_number?: number | null;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  explanation: string;
  suggestion: string;
  code_snippet?: string | null;
  approved: boolean;
  posted: boolean;
};

export type LogEvent = {
  id?: number;
  job_id: string;
  type: string;
  message: string;
  agent?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ReviewResults = {
  job: {
    id: string;
    status: "queued" | "running" | "completed" | "failed";
    owner: string;
    repo: string;
    pr_number: number;
    created_at: string;
    completed_at?: string | null;
  };
  findings: Finding[];
  summary?: string | null;
  logs: LogEvent[];
};
