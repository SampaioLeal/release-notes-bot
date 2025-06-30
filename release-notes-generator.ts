import {
  getCommitsSinceTag,
  getLatestTag,
  getPullRequestsSinceTag,
  getPullRequestsBetweenDates,
  getCommitsBetweenDates,
  getAllTags,
  octokit,
} from "./github.ts";
import { ReleaseData } from "./types.ts";
import { invokeLLama } from "./llm.ts";
import { createReleaseNotesPrompt } from "./prompt.ts";

/**
 * Gera release notes para tags existentes ou novas
 */
export async function generateReleaseNotes(
  owner: string,
  repo: string,
  targetTag: string,
  previousTag?: string,
  isExistingTag: boolean = false
): Promise<string> {
  console.log(
    isExistingTag
      ? `Coletando dados para ${owner}/${repo} entre ${
          previousTag || "início"
        } e ${targetTag}...`
      : `Coletando dados para ${owner}/${repo} desde a última tag...`
  );

  const releaseData = await collectReleaseData(
    owner,
    repo,
    targetTag,
    previousTag,
    isExistingTag
  );

  console.log(
    isExistingTag
      ? `Encontrados ${releaseData.pullRequests.length} PRs e ${releaseData.commits.length} commits entre ${releaseData.previousTag} e ${targetTag}`
      : `Encontrados ${releaseData.pullRequests.length} PRs e ${releaseData.commits.length} commits`
  );

  const prompt = createReleaseNotesPrompt(
    releaseData,
    repo.split("/").pop() || repo,
    owner
  );

  return await invokeLLama(prompt);
}

/**
 * Coleta dados de PRs e commits para a release
 */
async function collectReleaseData(
  owner: string,
  repo: string,
  targetTag: string,
  previousTag?: string,
  isExistingTag: boolean = false
): Promise<ReleaseData> {
  let finalPreviousTag = previousTag;
  let sinceDate: string;
  let pullRequests, commits;

  if (isExistingTag) {
    const result = await handleExistingTag(
      owner,
      repo,
      targetTag,
      finalPreviousTag
    );
    finalPreviousTag = result.previousTag;
    sinceDate = result.sinceDate;
    [pullRequests, commits] = await Promise.all([
      getPullRequestsBetweenDates(owner, repo, sinceDate, result.targetDate),
      getCommitsBetweenDates(owner, repo, sinceDate, result.targetDate),
    ]);
  } else {
    const result = await handleNewTag(owner, repo, finalPreviousTag);
    finalPreviousTag = result.previousTag;
    sinceDate = result.sinceDate;
    [pullRequests, commits] = await Promise.all([
      getPullRequestsSinceTag(owner, repo, sinceDate),
      getCommitsSinceTag(owner, repo, sinceDate),
    ]);
  }

  return {
    pullRequests,
    commits,
    previousTag: finalPreviousTag,
    newTag: targetTag,
  };
}

/**
 * Lida com lógica para tags existentes
 */
async function handleExistingTag(
  owner: string,
  repo: string,
  targetTag: string,
  previousTag?: string
) {
  let finalPreviousTag = previousTag;

  if (!finalPreviousTag) {
    const tags = await getAllTags(owner, repo);
    const targetIndex = tags.findIndex((tag) => tag === targetTag);
    if (targetIndex === -1) {
      throw new Error(`Tag ${targetTag} não encontrada`);
    }
    finalPreviousTag = tags[targetIndex + 1] || "";
  }

  const targetCommit = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: targetTag,
  });

  const targetDate = targetCommit.data.commit.author?.date || "";

  const sinceDate = finalPreviousTag
    ? (
        await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: finalPreviousTag,
        })
      ).data.commit.author?.date || ""
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return { previousTag: finalPreviousTag, sinceDate, targetDate };
}

/**
 * Lida com lógica para novas tags
 */
async function handleNewTag(owner: string, repo: string, previousTag?: string) {
  const finalPreviousTag = previousTag || (await getLatestTag(owner, repo));

  const sinceDate = finalPreviousTag
    ? (
        await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: finalPreviousTag,
        })
      ).data.commit.author?.date || ""
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  return { previousTag: finalPreviousTag, sinceDate };
}
