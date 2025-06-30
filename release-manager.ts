import { octokit } from "./github.ts";

/**
 * Gerencia criação e atualização de releases no GitHub
 */
export async function manageGitHubRelease(
  owner: string,
  repo: string,
  tag: string,
  releaseNotes: string,
  isExistingTag: boolean
): Promise<void> {
  const shouldCreateRelease = Deno.env.get("CREATE_RELEASE") === "true";
  const shouldUpdateRelease = Deno.env.get("UPDATE_RELEASE") === "true";

  if (!shouldCreateRelease && !shouldUpdateRelease) {
    return;
  }

  if (isExistingTag && shouldUpdateRelease) {
    await updateExistingRelease(owner, repo, tag, releaseNotes);
  } else if (!isExistingTag && shouldCreateRelease) {
    await createNewRelease(owner, repo, tag, releaseNotes);
  }
}

/**
 * Atualiza uma release existente ou cria uma nova se não encontrar
 */
async function updateExistingRelease(
  owner: string,
  repo: string,
  tag: string,
  releaseNotes: string
): Promise<void> {
  try {
    const { data: release } = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });

    await octokit.rest.repos.updateRelease({
      owner,
      repo,
      release_id: release.id,
      body: releaseNotes,
    });

    console.log(`\nRelease atualizada no GitHub para ${tag}`);
  } catch {
    console.log(`Release não encontrada para ${tag}, criando nova...`);
    await createNewRelease(owner, repo, tag, releaseNotes);
  }
}

/**
 * Cria uma nova release draft
 */
async function createNewRelease(
  owner: string,
  repo: string,
  tag: string,
  releaseNotes: string
): Promise<void> {
  await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body: releaseNotes,
    draft: true,
  });

  console.log(`\nRelease draft criada no GitHub para ${tag}`);
}
