import { validateEnvironment } from "./environment.ts";
import { generateReleaseNotes } from "./release-notes-generator.ts";
import { manageGitHubRelease } from "./release-manager.ts";

/**
 * Função principal da aplicação
 */
async function main() {
  try {
    const config = validateEnvironment();

    console.log(
      config.isExistingTag
        ? `Gerando release notes para tag existente ${config.owner}/${config.repo} ${config.targetTag}...`
        : `Gerando release notes para ${config.owner}/${config.repo} ${config.targetTag}...`
    );

    const releaseNotes = await generateReleaseNotes(
      config.owner,
      config.repo,
      config.targetTag,
      config.previousTag,
      config.isExistingTag
    );

    console.log("\n--- Release Notes Geradas ---");
    console.log(releaseNotes);

    await manageGitHubRelease(
      config.owner,
      config.repo,
      config.targetTag,
      releaseNotes,
      config.isExistingTag
    );
  } catch (error) {
    console.error("Erro ao gerar release notes:", error);
    Deno.exit(1);
  }
}

// Execute apenas se chamado diretamente
if (import.meta.main) {
  console.log("Iniciando o processo de geração de release notes...");
  main();
}

export { generateReleaseNotes, main };
