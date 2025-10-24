export type TokenCounts = {
  input: number
  output: number
  reasoning: number
  cache: {
    read: number
    write: number
  }
}

export type TokenMessage = {
  id: string
  role: string
  tokens: TokenCounts
  summary?: boolean
  system?: string[]
  providerID?: string
  modelID?: string
}

export type PartInfo = {
  type: string
  text?: string | null
}

export type RequestTotals = {
  input: number
  output: number
  reasoning: number
  total: number
}

export type ContextSummary = {
  tokens: number
  percentage: number | null
  compactionEvents: number
  conversationLength: number
  instructionTokens: number
  totalUserTokens: number
  totalAssistantTokens: number
  totalUserChars: number
  totalAssistantChars: number
}

const EMPTY_CONTEXT: ContextSummary = {
  tokens: 0,
  percentage: null,
  compactionEvents: 0,
  conversationLength: 0,
  instructionTokens: 0,
  totalUserTokens: 0,
  totalAssistantTokens: 0,
  totalUserChars: 0,
  totalAssistantChars: 0,
}

export function summarizeRequestTokens(messages: readonly TokenMessage[]): RequestTotals {
  const totals = messages.reduce(
    (memo, msg) => {
      if (msg.role !== "assistant") return memo
      return {
        input: memo.input + msg.tokens.input,
        output: memo.output + msg.tokens.output,
        reasoning: memo.reasoning + msg.tokens.reasoning,
      }
    },
    { input: 0, output: 0, reasoning: 0 },
  )
  const total = totals.input + totals.output + totals.reasoning
  return { ...totals, total }
}

export function summarizeContext(options: {
  messages: readonly TokenMessage[]
  partsFor: (id: string) => readonly PartInfo[]
  last?: TokenMessage
  contextLimit?: number | null
}): ContextSummary {
  const last =
    options.last ??
    options.messages.findLast((msg) => msg.role === "assistant" && msg.tokens.output > 0)
  if (!last) return EMPTY_CONTEXT

  const total =
    last.tokens.input +
    last.tokens.output +
    last.tokens.reasoning +
    last.tokens.cache.read +
    last.tokens.cache.write

  const compactionEvents = options.messages.reduce((count, msg) => {
    if (msg.role === "assistant" && msg.summary) return count + 1
    return count
  }, 0)

  const systemPrompt = last.system?.join("") ?? ""
  const instructionTokens = Math.round(systemPrompt.length / 4)
  const conversationLength = total > instructionTokens ? total - instructionTokens : 0

  const charTotals = options.messages.reduce(
    (memo, msg) => {
      const parts = options.partsFor(msg.id) ?? []
      const textLength = parts.reduce((sum, part) => {
        if (part.type !== "text") return sum
        if (!part.text) return sum
        return sum + part.text.length
      }, 0)

      if (msg.role === "user") {
        return { user: memo.user + textLength, assistant: memo.assistant }
      }
      if (msg.role === "assistant") {
        return { user: memo.user, assistant: memo.assistant + textLength }
      }
      return memo
    },
    { user: 0, assistant: 0 },
  )

  const totalChars = charTotals.user + charTotals.assistant
  const userRatio = totalChars > 0 ? charTotals.user / totalChars : 0
  const assistantRatio = totalChars > 0 ? charTotals.assistant / totalChars : 0

  const percentage =
    typeof options.contextLimit === "number" && options.contextLimit > 0
      ? Math.round((total / options.contextLimit) * 100)
      : null

  return {
    tokens: total,
    percentage,
    compactionEvents,
    conversationLength,
    instructionTokens,
    totalUserTokens: Math.round(conversationLength * userRatio),
    totalAssistantTokens: Math.round(conversationLength * assistantRatio),
    totalUserChars: charTotals.user,
    totalAssistantChars: charTotals.assistant,
  }
}
