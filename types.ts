export interface PullRequest {
  number: number;
  title: string;
  body: string;
  labels: string[];
  author: string;
  mergedAt: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface ReleaseData {
  pullRequests: PullRequest[];
  commits: Commit[];
  previousTag: string;
  newTag: string;
}

export interface ReleaseConfig {
  owner: string;
  repo: string;
  targetTag: string;
  previousTag?: string;
  isExistingTag: boolean;
}
