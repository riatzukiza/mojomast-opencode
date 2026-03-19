import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION from "./websearch.txt"
import { abortAfterAny } from "../util/abort"
import { Provider } from "../provider/provider"
import { webSearch } from "../provider/sdk/copilot/responses/tool/web-search"
import { ProviderTransform } from "../provider/transform"
import { Auth } from "../auth"
import { SystemPrompt } from "../session/system"
import { Flag } from "../flag/flag"
import type { LanguageModelV2Content, LanguageModelV2Source } from "@ai-sdk/provider"

const EXA_API_CONFIG = {
  BASE_URL: "https://mcp.exa.ai",
  ENDPOINTS: {
    SEARCH: "/mcp",
  },
  DEFAULT_NUM_RESULTS: 8,
} as const

interface McpSearchRequest {
  jsonrpc: string
  id: number
  method: string
  params: {
    name: string
    arguments: {
      query: string
      numResults?: number
      livecrawl?: "fallback" | "preferred"
      type?: "auto" | "fast" | "deep"
      contextMaxCharacters?: number
    }
  }
}

interface McpSearchResponse {
  jsonrpc: string
  result: {
    content: Array<{
      type: string
      text: string
    }>
  }
}

function supportsOpenAIWebSearch(model: Provider.Model | undefined): boolean {
  if (!model) return false
  // OpenAI Responses API (same endpoint family Codex CLI uses)
  if (model.providerID === "openai") return true
  // Azure often uses Responses API too, but feature availability varies by account/model.
  // We enable it optimistically; failures fall back to Exa when available.
  if (model.providerID.includes("azure")) return true
  return false
}

function openAISearchContextSize(params: {
  type?: "auto" | "fast" | "deep"
  contextMaxCharacters?: number
}): "low" | "medium" | "high" {
  if (params.type === "deep") return "high"
  if ((params.contextMaxCharacters ?? 0) >= 15000) return "high"
  if (params.type === "fast") return "low"
  return "medium"
}

function formatSourcesMd(sources: LanguageModelV2Source[]): string {
  const urlSources = sources.filter((s): s is Extract<LanguageModelV2Source, { sourceType: "url" }> => {
    return s.type === "source" && s.sourceType === "url"
  })

  if (urlSources.length === 0) return ""

  return [
    "\n\nSources:",
    ...urlSources.map((s) => `- ${s.title ? `[${s.title}](${s.url})` : s.url}`),
  ].join("\n")
}

async function openAIWebSearch(
  params: {
    query: string
    numResults?: number
    type?: "auto" | "fast" | "deep"
    contextMaxCharacters?: number
  },
  ctx: Tool.Context,
  model: Provider.Model,
) {
  const [language, provider, auth] = await Promise.all([
    Provider.getLanguage(model),
    Provider.getProvider(model.providerID),
    Auth.get(model.providerID),
  ])

  // Match the Codex CLI behavior: for OpenAI OAuth (Codex) sessions, use `instructions`.
  const isCodex = provider.id === "openai" && auth?.type === "oauth"

  const desiredResults = params.numResults ?? 8
  const year = new Date().getFullYear()

  const queryPrompt = [
    `You are a web search retriever.`,
    `Today is ${year}. If the query is time-sensitive, bias toward ${year} sources.`,
    `Search the web for: ${JSON.stringify(params.query)}.`,
    `Return up to ${desiredResults} results as a markdown list.`,
    `Each item MUST include: title, url, and a 1-2 sentence snippet.`,
    `Do not include any extra commentary outside the list.`,
  ].join("\n")

  // Provider-defined tool declaration (executed server-side by OpenAI)
  const toolDef = webSearch({
    searchContextSize: openAISearchContextSize(params),
  })

  // For Codex OAuth, opencode sends its system instructions via provider options.
  // For normal OpenAI API key usage, this is harmless.
  const providerOptions = ProviderTransform.providerOptions(model, {
    ...(isCodex ? { instructions: SystemPrompt.instructions() } : undefined),
    ...(model.providerID === "openai" ? { include: ["web_search_call.action.sources"] } : undefined),
  })

  const generated = await language.doGenerate({
    abortSignal: ctx.abort,
    maxOutputTokens: 900,
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: queryPrompt }],
      },
    ],
    tools: [toolDef as any],
    toolChoice: { type: "tool", toolName: "web_search" },
    providerOptions,
  })

  const content = generated.content as LanguageModelV2Content[]

  const text = content
    .filter((c): c is Extract<LanguageModelV2Content, { type: "text" }> => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim()

  const sources = content.filter((c): c is LanguageModelV2Source => c.type === "source")

  return {
    output: `${text}${formatSourcesMd(sources)}`.trim(),
    title: `Web search: ${params.query}`,
  }
}

async function exaWebSearch(
  params: {
    query: string
    numResults?: number
    livecrawl?: "fallback" | "preferred"
    type?: "auto" | "fast" | "deep"
    contextMaxCharacters?: number
  },
  ctx: Tool.Context,
) {
  const searchRequest: McpSearchRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "web_search_exa",
      arguments: {
        query: params.query,
        type: params.type || "auto",
        numResults: params.numResults || EXA_API_CONFIG.DEFAULT_NUM_RESULTS,
        livecrawl: params.livecrawl || "fallback",
        contextMaxCharacters: params.contextMaxCharacters,
      },
    },
  }

  const { signal, clearTimeout } = abortAfterAny(25000, ctx.abort)

  try {
    const headers: Record<string, string> = {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    }

    const response = await fetch(`${EXA_API_CONFIG.BASE_URL}${EXA_API_CONFIG.ENDPOINTS.SEARCH}`, {
      method: "POST",
      headers,
      body: JSON.stringify(searchRequest),
      signal,
    })

    clearTimeout()

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Search error (${response.status}): ${errorText}`)
    }

    const responseText = await response.text()

    // Parse SSE response
    const lines = responseText.split("\n")
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data: McpSearchResponse = JSON.parse(line.substring(6))
        if (data.result && data.result.content && data.result.content.length > 0) {
          return {
            output: data.result.content[0].text,
            title: `Web search: ${params.query}`,
          }
        }
      }
    }

    return {
      output: "No search results found. Please try a different query.",
      title: `Web search: ${params.query}`,
    }
  } catch (error) {
    clearTimeout()

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Search request timed out")
    }

    throw error
  }
}

export const WebSearchTool = Tool.define("websearch", async () => {
  return {
    get description() {
      return DESCRIPTION.replace("{{year}}", new Date().getFullYear().toString())
    },
    parameters: z.object({
      query: z.string().describe("Websearch query"),
      numResults: z.number().optional().describe("Number of search results to return (default: 8)"),
      livecrawl: z
        .enum(["fallback", "preferred"])
        .optional()
        .describe(
          "Live crawl mode - 'fallback': use live crawling as backup if cached content unavailable, 'preferred': prioritize live crawling (default: 'fallback')",
        ),
      type: z
        .enum(["auto", "fast", "deep"])
        .optional()
        .describe(
          "Search type - 'auto': balanced search (default), 'fast': quick results, 'deep': comprehensive search",
        ),
      contextMaxCharacters: z
        .number()
        .optional()
        .describe("Maximum characters for context string optimized for LLMs (default: 10000)"),
    }),
    async execute(params, ctx) {
      await ctx.ask({
        permission: "websearch",
        patterns: [params.query],
        always: ["*"],
        metadata: {
          query: params.query,
          numResults: params.numResults,
          livecrawl: params.livecrawl,
          type: params.type,
          contextMaxCharacters: params.contextMaxCharacters,
        },
      })

      const model = (ctx.extra as any)?.model as Provider.Model | undefined

      // Prefer OpenAI built-in web_search when using OpenAI/Azure (Codex-like behavior).
      if (supportsOpenAIWebSearch(model)) {
        try {
          const result = await openAIWebSearch(params, ctx, model!)
          return {
            output: result.output,
            title: result.title,
            metadata: { backend: "openai" },
          }
        } catch (err) {
          // If OpenAI web search fails (unsupported model/account), fall back to Exa if available.
          // Otherwise surface the original error.
          if (!Flag.OPENCODE_ENABLE_EXA) {
            throw err
          }
        }
      }

      const exa = await exaWebSearch(params, ctx)
      return {
        output: exa.output,
        title: exa.title,
        metadata: { backend: "exa" },
      }
    },
  }
})
