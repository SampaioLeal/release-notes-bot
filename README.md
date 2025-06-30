# Release Notes Bot 🚀

Bot para gerar release notes automaticamente usando dados do GitHub e AI (AWS Bedrock/LLama).

## 📁 Estrutura do Projeto

```
release-notes-bot/
├── main.ts                    # Ponto de entrada principal
├── config.ts                  # Configurações e constantes
├── environment.ts             # Validação de variáveis de ambiente
├── github.ts                  # Integração com GitHub API
├── llm.ts                     # Integração com AWS Bedrock/LLama
├── prompt.ts                  # Geração de prompts para AI
├── release-notes-generator.ts # Lógica de geração de release notes
├── release-manager.ts         # Gerenciamento de releases no GitHub
├── utils.ts                   # Funções utilitárias
├── types.ts                   # Definições de tipos TypeScript
├── deno.json                  # Configuração do Deno
└── README.md                  # Documentação
```

## ✨ Funcionalidades

- ✅ Gerar release notes para novas tags
- ✅ Gerar release notes para tags já existentes
- ✅ Atualizar releases existentes no GitHub
- ✅ Criar releases draft no GitHub
- ✅ Detecção automática do tipo de operação
- ✅ Filtrar commits de merge automaticamente
- ✅ Reconhecimento de contribuidores por contribuição
- ✅ Uso de nicknames do GitHub (@login) ao invés de nomes completos

## ⚙️ Configuração

### Variáveis de Ambiente Obrigatórias

```bash
export GITHUB_TOKEN="seu_github_token"
export GITHUB_OWNER="owner_do_repositorio"
export GITHUB_REPO="nome_do_repositorio"
```

### Variáveis de Ambiente Opcionais

```bash
export CREATE_RELEASE="true"     # Criar release para novas tags
export UPDATE_RELEASE="true"     # Atualizar release para tags existentes
```

### Configuração AWS

Certifique-se de ter as credenciais AWS configuradas para usar o AWS Bedrock.

## Uso

O sistema agora detecta automaticamente se você quer gerar release notes para uma tag existente ou uma nova tag baseado nas variáveis de ambiente fornecidas.

### Para Novas Tags

```bash
export NEW_TAG="v1.3.0"
export CREATE_RELEASE="true"  # Opcional: criar release no GitHub
deno task run
```

### Para Tags Existentes

```bash
export TARGET_TAG="v1.2.0"
export PREVIOUS_TAG="v1.1.0"  # Opcional: se não fornecido, busca automaticamente
export UPDATE_RELEASE="true"  # Opcional: atualizar/criar release no GitHub
deno task run
```

### Exemplos Práticos

#### Gerar release notes para tag existente (automático)

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
export GITHUB_OWNER="minha-empresa"
export GITHUB_REPO="meu-projeto"
export TARGET_TAG="v2.1.0"
deno task run
```

#### Gerar e atualizar release no GitHub

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
export GITHUB_OWNER="minha-empresa"
export GITHUB_REPO="meu-projeto"
export TARGET_TAG="v2.1.0"
export PREVIOUS_TAG="v2.0.5"
export UPDATE_RELEASE="true"
deno task run
```

#### Gerar para nova tag

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
export GITHUB_OWNER="minha-empresa"
export GITHUB_REPO="meu-projeto"
export NEW_TAG="v2.2.0"
export CREATE_RELEASE="true"
deno task run
```

## Como Funciona

### Detecção Automática

- Se `TARGET_TAG` estiver definida → Modo "tag existente"
- Se `NEW_TAG` estiver definida → Modo "nova tag"
- Se ambas estiverem definidas → Usa `TARGET_TAG` (tag existente)

### Para Tags Existentes

1. **Busca Automática da Tag Anterior**: Se `PREVIOUS_TAG` não for fornecida, o sistema busca automaticamente a tag anterior no repositório
2. **Coleta de Dados**: Busca todos os PRs e commits entre as duas tags
3. **Geração**: Usa AI para gerar release notes em português brasileiro
4. **Publicação**: Opcionalmente atualiza ou cria a release no GitHub

### Para Novas Tags

1. **Busca da Última Tag**: Encontra automaticamente a última tag do repositório
2. **Coleta de Dados**: Busca PRs e commits desde a última tag
3. **Geração**: Usa AI para gerar release notes
4. **Publicação**: Opcionalmente cria uma nova release draft no GitHub

## Estrutura dos Release Notes

Os release notes gerados seguem esta estrutura:

1. **Resumo das mudanças**
2. **Novas Funcionalidades**
3. **Correções de Bugs**
4. **Melhorias**
5. **Breaking Changes**
6. **Atualizações de Dependências**

### 👥 Tratamento de Contribuidores

O sistema foi otimizado para creditar contribuidores de forma consistente e organizada:

- **Para Pull Requests**: Usa `pr.user.login` (nickname do GitHub)
- **Para Commits**: Prioriza `commit.author.login` (nickname), com fallback para `commit.commit.author.name` (nome completo)
- **Nas Release Notes**:
  - Bullets limpos sem autores individuais
  - Seção dedicada "📬 Pull Requests" no final
  - Formato: `#123 por @autor - título do PR`
- **Filtros**: Remove merge commits automaticamente para evitar duplicações
- **Organização**: Separação clara entre conteúdo e créditos

### 📋 Formato das Release Notes

```markdown
🚀 projeto v1.2.0 - Título Criativo

## ✨ O que mudou

### 🆕 Novas Funcionalidades

- Adiciona autenticação JWT
- Implementa dashboard de métricas

### 🐛 Correções

- Corrige bug na validação de dados
- Resolve problema de performance

### ⚡ Melhorias

- Melhora tempo de resposta da API
- Atualiza dependências do projeto

## 📬 Pull Requests

- #123 por @toninho-dev - feat: adiciona autenticação JWT
- #124 por @maria-silva - feat: implementa dashboard de métricas
- #125 por @carlos-dev - fix: corrige bug na validação
- #126 por @ana-santos - fix: resolve problema de performance

## 📋 Changelog Completo

**Full Changelog**: https://github.com/owner/repo/compare/v1.1.0...v1.2.0
```

## Dependências

- Deno
- AWS SDK para Bedrock
- Octokit (GitHub API)
- Acesso ao AWS Bedrock (modelo Meta Llama 4 Scout)

## 🤖 Otimizações do LLM

O bot foi otimizado especificamente para o **Meta Llama 4 Scout** no AWS Bedrock:

### Formato de Prompt Otimizado

- **Template Oficial**: Usa o formato recomendado pela AWS `<|begin_of_text|><|start_header_id|>system<|end_header_id|>`
- **System Prompt**: Contexto separado para melhor compreensão do papel
- **User Prompt**: Dados estruturados e instruções claras
- **Assistant Prompt**: Preparado para resposta direta

### Parâmetros Ajustados

- **Temperature**: 0.1 (baixa aleatoriedade para consistência)
- **Top_P**: 0.7 (foco em tokens mais prováveis)
- **Repetition Penalty**: 1.1 (evita repetições)
- **Max Gen Len**: 1500 (suficiente para release notes completas)

### Pós-processamento

- Remove artefatos do template (`<|.*|>`)
- Elimina linhas duplicadas consecutivas
- Limpa espaços em branco desnecessários
- Filtra repetições de conteúdo

## Melhorias na Refatoração

- ✅ Código mais limpo e sem duplicação
- ✅ Função única para gerar release notes
- ✅ Validação centralizada de ambiente
- ✅ Detecção automática do tipo de operação
- ✅ Gerenciamento unificado de releases GitHub
- ✅ Comandos simplificados
- ✅ Uso consistente de nicknames do GitHub para @mentions
- ✅ Filtros de merge commits para evitar duplicações
- ✅ Créditos inline por contribuição específica
- ✅ Prompt otimizado para Meta Llama 4 Scout
- ✅ Parâmetros LLM ajustados para melhor qualidade
- ✅ Pós-processamento robusto contra repetições
