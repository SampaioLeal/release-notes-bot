import { Commit, PullRequest } from "./types.ts";
import { MERGE_PATTERNS, COMMIT_LIMITS } from "./config.ts";

/**
 * Filtra commits de merge baseado em padrões conhecidos
 */
export function filterMergeCommits(commits: Commit[]): Commit[] {
  return commits.filter((commit) => {
    const message = commit.message.toLowerCase();
    return !MERGE_PATTERNS.some(
      (pattern) => message.includes(pattern) || message.startsWith(pattern)
    );
  });
}

/**
 * Extrai contribuidores únicos de PRs e commits
 */
export function extractUniqueContributors(
  pullRequests: PullRequest[],
  commits: Commit[]
): string[] {
  const allContributors = new Set([
    ...pullRequests.map((pr) => pr.author),
    ...commits.map((commit) => commit.author),
  ]);

  return Array.from(allContributors).filter((author) => author !== "unknown");
}

/**
 * Limita e processa commits para o prompt
 */
export function processCommitsForPrompt(
  commits: Commit[],
  maxCommits: number = COMMIT_LIMITS.maxCommits
) {
  const filteredCommits = filterMergeCommits(commits);

  return filteredCommits.slice(0, maxCommits).map((commit) => ({
    message: commit.message.split("\n")[0],
    author: commit.author,
  }));
}

/**
 * Processa PRs para o prompt
 */
export function processPullRequestsForPrompt(pullRequests: PullRequest[]) {
  return pullRequests.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.author,
    labels: pr.labels,
  }));
}
