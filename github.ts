import { Octokit } from "octokit";
import { Commit, PullRequest } from "./types.ts";

export const octokit = new Octokit({
  auth: Deno.env.get("GITHUB_TOKEN"),
});

export async function getPullRequestsSinceTag(
  owner: string,
  repo: string,
  since: string
): Promise<PullRequest[]> {
  const { data: prs } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
  });

  return prs
    .filter((pr) => pr.merged_at && new Date(pr.merged_at) > new Date(since))
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body || "",
      labels: pr.labels.map((label) =>
        typeof label === "string" ? label : label.name || ""
      ),
      author: pr.user?.login || "unknown",
      mergedAt: pr.merged_at!,
    }));
}

export async function getCommitsSinceTag(
  owner: string,
  repo: string,
  since: string
): Promise<Commit[]> {
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since,
  });

  return commits.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.author?.login || commit.commit.author?.name || "unknown",
    date: commit.commit.author?.date || "",
  }));
}

export async function getLatestTag(
  owner: string,
  repo: string
): Promise<string> {
  try {
    const { data: tags } = await octokit.rest.repos.listTags({
      owner,
      repo,
      per_page: 1,
    });
    return tags[0]?.name || "";
  } catch {
    return "";
  }
}

export async function getPullRequestsBetweenDates(
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<PullRequest[]> {
  const { data: prs } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });

  const sinceDate = new Date(since);
  const untilDate = new Date(until);

  return prs
    .filter((pr) => {
      if (!pr.merged_at) return false;
      const mergedDate = new Date(pr.merged_at);
      return mergedDate >= sinceDate && mergedDate <= untilDate;
    })
    .map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body || "",
      labels: pr.labels.map((label) =>
        typeof label === "string" ? label : label.name || ""
      ),
      author: pr.user?.login || "unknown",
      mergedAt: pr.merged_at!,
    }));
}

export async function getCommitsBetweenDates(
  owner: string,
  repo: string,
  since: string,
  until: string
): Promise<Commit[]> {
  const { data: commits } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    since,
    until,
    per_page: 100,
  });

  return commits.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.author?.login || commit.commit.author?.name || "unknown",
    date: commit.commit.author?.date || "",
  }));
}

export async function getAllTags(
  owner: string,
  repo: string
): Promise<string[]> {
  const { data: tags } = await octokit.rest.repos.listTags({
    owner,
    repo,
    per_page: 100,
  });

  return tags.map((tag) => tag.name);
}
