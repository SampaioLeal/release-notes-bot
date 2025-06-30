import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { AWS_CONFIG, LLM_CONFIG } from "./config.ts";

// --- Cliente AWS Bedrock ---
const bedrockClient = new BedrockRuntimeClient({ region: AWS_CONFIG.region });

/**
 * Invoca o modelo Meta Llama 4 Scout via AWS Bedrock
 */
export async function invokeLLama(prompt: string): Promise<string> {
  const payload = {
    prompt: prompt,
    max_gen_len: LLM_CONFIG.maxGenLen,
    temperature: LLM_CONFIG.temperature,
    top_p: LLM_CONFIG.topP,
  };

  const encoder = new TextEncoder();
  const encodedPayload = encoder.encode(JSON.stringify(payload));

  const command = new InvokeModelCommand({
    modelId: AWS_CONFIG.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: encodedPayload,
  });

  try {
    const response = await bedrockClient.send(command);
    const decoder = new TextDecoder("utf-8");
    const decodedResponseBody = decoder.decode(response.body);
    const parsedResponseBody = JSON.parse(decodedResponseBody);

    let generatedText = parsedResponseBody.generation;

    // Remove possíveis repetições e limpa a resposta
    generatedText = cleanResponse(generatedText);

    return generatedText;
  } catch (error) {
    console.error("Erro ao invocar o modelo Bedrock:", error);
    throw error;
  }
}

/**
 * Limpa e otimiza a resposta do modelo
 */
function cleanResponse(text: string): string {
  // Remove linhas duplicadas consecutivas
  const lines = text.split("\n");
  const cleanedLines: string[] = [];
  let lastLine = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Evita duplicação de linhas idênticas consecutivas
    if (trimmedLine !== lastLine || trimmedLine === "") {
      cleanedLines.push(line);
      lastLine = trimmedLine;
    }
  }

  let cleaned = cleanedLines.join("\n");

  // Remove possíveis artefatos do template do Llama
  cleaned = cleaned
    .replace(/<\|[^|]*\|>/g, "") // Remove tags do template
    .replace(/^\s*\n+/, "") // Remove linhas vazias do início
    .replace(/\n\s*$/, "") // Remove espaços em branco do final
    .trim();

  return cleaned;
}
