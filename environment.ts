import { ReleaseConfig } from "./types.ts";

/**
 * Valida e extrai configurações das variáveis de ambiente
 */
export function validateEnvironment(): ReleaseConfig {
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  const owner = Deno.env.get("GITHUB_OWNER");
  const repo = Deno.env.get("GITHUB_REPO");
  const targetTag = Deno.env.get("TARGET_TAG");
  const newTag = Deno.env.get("NEW_TAG");
  const previousTag = Deno.env.get("PREVIOUS_TAG");

  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!owner || !repo) {
    throw new Error(
      "GITHUB_OWNER and GITHUB_REPO environment variables are required"
    );
  }

  if (!targetTag && !newTag) {
    throw new Error(
      "Either TARGET_TAG (for existing tags) or NEW_TAG (for new tags) environment variable is required"
    );
  }

  const isExistingTag = !!targetTag;
  const tag = targetTag || newTag!;

  return {
    owner,
    repo,
    targetTag: tag,
    previousTag,
    isExistingTag,
  };
}
