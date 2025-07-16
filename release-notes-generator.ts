// Importa funções de integração com GitHub e tipos
import {
  getCommitsSinceTag, // Busca commits desde uma data
  getLatestTag, // Busca a última tag do repositório
  getPullRequestsSinceTag, // Busca PRs desde uma data
  getPullRequestsBetweenDates, // Busca PRs entre datas
  getCommitsBetweenDates, // Busca commits entre datas
  getAllTags, // Busca todas as tags do repositório
  octokit, // Instância do Octokit para chamadas diretas
} from "./github.ts";
import { ReleaseData } from "./types.ts";
import { invokeLLama } from "./llm.ts";
import { createReleaseNotesPrompt } from "./prompt.ts";

/**
 * Função principal para geração de release notes.
 * - Coleta dados de PRs e commits relevantes
 * - Gera o prompt para o LLM
 * - Invoca o modelo Llama para gerar o texto final
 */
export async function generateReleaseNotes(
  owner: string,
  repo: string,
  targetTag: string,
  previousTag?: string,
  isExistingTag: boolean = false
): Promise<string> {
  // Log de contexto para o usuário
  console.log(
    isExistingTag
      ? `Coletando dados para ${owner}/${repo} entre ${
          previousTag || "início"
        } e ${targetTag}...`
      : `Coletando dados para ${owner}/${repo} desde a última tag...`
  );

  // Coleta todos os dados relevantes para a release
  const releaseData = await collectReleaseData(
    owner,
    repo,
    targetTag,
    previousTag,
    isExistingTag
  );

  // Loga estatísticas de PRs e commits encontrados
  console.log(
    isExistingTag
      ? `Encontrados ${releaseData.pullRequests.length} PRs e ${releaseData.commits.length} commits entre ${releaseData.previousTag} e ${targetTag}`
      : `Encontrados ${releaseData.pullRequests.length} PRs e ${releaseData.commits.length} commits`
  );

  // Gera o prompt estruturado para o LLM
  const prompt = createReleaseNotesPrompt(
    releaseData,
    repo.split("/").pop() || repo,
    owner
  );

  // Invoca o modelo Llama para gerar o texto final das release notes
  return await invokeLLama(prompt);
}

/**
 * Coleta dados de PRs e commits para a release.
 * - Busca PRs e commits do branch principal
 * - Para cada PR, busca todos os commits daquela PR
 * - Mescla todos os commits, evitando duplicidade (por SHA)
 * - Retorna estrutura ReleaseData para uso no prompt
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

  // Decide se busca por intervalo de datas (tag existente) ou desde última tag (nova tag)
  if (isExistingTag) {
    const result = await handleExistingTag(
      owner,
      repo,
      targetTag,
      finalPreviousTag
    );
    finalPreviousTag = result.previousTag;
    sinceDate = result.sinceDate;
    pullRequests = await getPullRequestsBetweenDates(
      owner,
      repo,
      sinceDate,
      result.targetDate
    );
    commits = await getCommitsBetweenDates(
      owner,
      repo,
      sinceDate,
      result.targetDate
    );
  } else {
    const result = await handleNewTag(owner, repo, finalPreviousTag);
    finalPreviousTag = result.previousTag;
    sinceDate = result.sinceDate;
    pullRequests = await getPullRequestsSinceTag(owner, repo, sinceDate);
    commits = await getCommitsSinceTag(owner, repo, sinceDate);
  }

  // Para cada PR encontrada, busca todos os commits daquela PR
  const prCommitsArrays = await Promise.all(
    pullRequests.map(async (pr) => {
      try {
        // Busca commits da PR pelo número
        const { data: prCommits } = await octokit.rest.pulls.listCommits({
          owner,
          repo,
          pull_number: pr.number,
          per_page: 100,
        });
        // Formata commits para o padrão da aplicação
        return prCommits.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author:
            commit.author?.login || commit.commit.author?.name || "unknown",
          date: commit.commit.author?.date || "",
        }));
      } catch {
        // Se falhar, retorna array vazio
        return [];
      }
    })
  );

  // Mescla todos os commits das PRs ao array principal, evitando duplicidade por SHA
  const allCommitsMap = new Map();
  for (const commit of commits) {
    allCommitsMap.set(commit.sha, commit);
  }
  for (const prCommits of prCommitsArrays) {
    for (const commit of prCommits) {
      allCommitsMap.set(commit.sha, commit);
    }
  }

  // Array final de commits únicos
  const allCommits = Array.from(allCommitsMap.values());

  return {
    pullRequests,
    commits: allCommits,
    previousTag: finalPreviousTag,
    newTag: targetTag,
  };
}

/**
 * Lógica para tags existentes:
 * - Busca a tag anterior se não informada
 * - Busca datas de commit das tags para definir intervalo
 * - Retorna datas para busca de PRs/commits
 */
async function handleExistingTag(
  owner: string,
  repo: string,
  targetTag: string,
  previousTag?: string
) {
  let finalPreviousTag = previousTag;

  // Se não informado, busca a tag anterior no repositório
  if (!finalPreviousTag) {
    const tags = await getAllTags(owner, repo);
    const targetIndex = tags.findIndex((tag) => tag === targetTag);
    if (targetIndex === -1) {
      throw new Error(`Tag ${targetTag} não encontrada`);
    }
    finalPreviousTag = tags[targetIndex + 1] || "";
  }

  // Busca data do commit da tag alvo
  const targetCommit = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: targetTag,
  });
  const targetDate = targetCommit.data.commit.author?.date || "";

  // Busca data do commit da tag anterior
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
 * Lógica para novas tags:
 * - Busca a última tag se não informada
 * - Busca data do commit da última tag
 * - Retorna data para busca de PRs/commits
 */
async function handleNewTag(owner: string, repo: string, previousTag?: string) {
  const finalPreviousTag = previousTag || (await getLatestTag(owner, repo));

  // Busca data do commit da última tag
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
