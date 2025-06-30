import { ReleaseData } from "./types.ts";
import {
  extractUniqueContributors,
  processCommitsForPrompt,
  processPullRequestsForPrompt,
} from "./utils.ts";

/**
 * Cria o prompt para geração de release notes otimizado para Meta Llama 4 Scout
 */
export function createReleaseNotesPrompt(
  data: ReleaseData,
  repoName: string,
  owner: string
): string {
  const contributors = extractUniqueContributors(
    data.pullRequests,
    data.commits
  );
  const processedCommits = processCommitsForPrompt(data.commits);
  const processedPRs = processPullRequestsForPrompt(data.pullRequests);

  const releaseData = JSON.stringify(
    {
      version: data.newTag,
      previousVersion: data.previousTag || "Versão inicial",
      repositoryName: repoName,
      pullRequests: processedPRs,
      commits: processedCommits,
      contributors: contributors,
    },
    null,
    2
  );

  return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Você é um engenheiro DevOps especializado em comunicação técnica. Sua responsabilidade é criar notas de lançamento (release notes) envolventes e informativas em português brasileiro.

REGRAS OBRIGATÓRIAS:
1. Use APENAS os dados fornecidos
2. NÃO invente informações que não estão nos dados
3. Use palavras específicas: "Adiciona/Implementa" para features, "Corrige/Resolve" para bugs
4. Organize: features primeiro, depois correções
5. NÃO inclua autores nos bullets individuais
6. SEMPRE inclua uma seção "Pull Requests" no final com PRs e autores
7. SEMPRE inclua o link para changelog completo
8. Responda APENAS com as release notes formatadas
9. NÃO inclua seções vazias<|eot_id|><|start_header_id|>user<|end_header_id|>

Crie release notes para a versão ${data.newTag} do software ${repoName}.

DADOS PARA ANÁLISE:
${releaseData}

ESTRUTURA OBRIGATÓRIA:
🚀 ${repoName} v${data.newTag} - [Título Criativo]

## ✨ O que mudou

### 🆕 Novas Funcionalidades
- Adiciona [feature]
- Implementa [improvement]

### 🐛 Correções
- Corrige [bug]
- Resolve [issue]

### ⚡ Melhorias
- Melhora [performance/usability]
- Atualiza [dependencies]

## 📬 Pull Requests
- #123 por @autor - [título do PR]
- #124 por @autor - [título do PR]
- #125 por @autor - [título do PR]

## 📋 Changelog Completo
**Full Changelog**: https://github.com/${owner}/${repoName}/compare/${
    data.previousTag || "início"
  }...${data.newTag}

IMPORTANTE: Use emojis para tornar visualmente atrativo. Seja específico sobre os benefícios. Mantenha os bullets limpos sem autores. Liste todos os PRs com seus autores na seção dedicada.<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}
