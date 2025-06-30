// --- Configurações e Constantes ---

export const AWS_CONFIG = {
  region: "us-east-2",
  modelId: "us.meta.llama4-scout-17b-instruct-v1:0",
} as const;

export const LLM_CONFIG = {
  maxGenLen: 1500,
  temperature: 0.1,
  topP: 0.7,
} as const;

export const COMMIT_LIMITS = {
  maxCommits: 100,
  maxPullRequests: 100,
} as const;

export const MERGE_PATTERNS = [
  "merge",
  "merged",
  "merge pull request",
  "merge branch",
] as const;
