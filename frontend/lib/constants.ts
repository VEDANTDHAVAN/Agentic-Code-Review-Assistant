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

export const AI_MODEL_PRESETS = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
  openrouter: [
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-flash-1.5",
    "deepseek/deepseek-chat",
    "meta-llama/llama-3.1-70b-instruct",
  ],
} as const;
