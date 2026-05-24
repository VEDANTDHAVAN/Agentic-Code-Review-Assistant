export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export const AGENT_PIPELINE = [
  "PRFetcherAgent",
  "ContextBuilderAgent",
  "SecurityReviewAgent",
  "BugDetectionAgent",
  "PerformanceReviewAgent",
  "CodeSmellAgent",
  "SummaryAgent",
] as const;

export const SEVERITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
} as const;
