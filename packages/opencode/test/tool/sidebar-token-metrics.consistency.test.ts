import { describe, expect, test } from "bun:test"
import { computeTokenMetrics } from "../../src/util/token-metrics"

// Mock data that matches the structure used in both TUI sidebar and web Share component
const createMockMessages = () => [
  {
    id: "msg1",
    role: "user" as const,
    parts: [{ type: "text", text: "Hello, how are you?" }],
    tokens: { input: 0, output: 0, reasoning: 0 },
    cost: 0,
  },
  {
    id: "msg2",
    role: "assistant" as const,
    parts: [{ type: "text", text: "I'm doing well, thank you for asking!" }],
    tokens: { input: 10, output: 15, reasoning: 5, cache: { read: 0, write: 0 } },
    cost: 0.002,
    providerID: "openai",
    modelID: "gpt-4",
    system: ["You are a helpful assistant."],
  },
  {
    id: "msg3",
    role: "user" as const,
    parts: [{ type: "text", text: "Can you help me with a coding problem?" }],
    tokens: { input: 0, output: 0, reasoning: 0 },
    cost: 0,
  },
  {
    id: "msg4",
    role: "assistant" as const,
    parts: [
      { type: "text", text: "I'd be happy to help you with your coding problem. What specific issue are you facing?" },
    ],
    tokens: { input: 20, output: 25, reasoning: 8, cache: { read: 2, write: 1 } },
    cost: 0.004,
    providerID: "openai",
    modelID: "gpt-4",
    summary: false,
  },
]

const createMockModels = () => ({
  openai: {
    models: {
      "gpt-4": {
        limit: { context: 8000 },
      },
    },
  },
})

// Helper function to calculate tokens the same way as TUI sidebar and web Share component
function calculateTokensLikeComponents(messages: any[], models: any) {
  const last = [...messages].reverse().find((m) => m.role === "assistant" && (m.tokens?.output ?? 0) > 0)

  if (!last) {
    return {
      tokensTotal: 0,
      conversationLength: 0,
      instructionTokens: 0,
      totalUserTokens: 0,
      totalAssistantTokens: 0,
      compactionEvents: 0,
    }
  }

  const total =
    (last.tokens?.input ?? 0) +
    (last.tokens?.output ?? 0) +
    (last.tokens?.reasoning ?? 0) +
    (last.tokens?.cache?.read ?? 0) +
    (last.tokens?.cache?.write ?? 0)

  // Count compaction events (summary messages)
  const compactionEvents = messages.filter((x) => x.role === "assistant" && x.summary).length

  // Get system prompt content
  const systemPromptContent = last.system?.join("") || ""
  const systemPromptChars = systemPromptContent.length
  const estimatedSystemTokens = Math.round(systemPromptChars / 4)

  // Calculate conversation length (total minus instruction tokens)
  const conversationLength = Math.max(0, total - estimatedSystemTokens)

  // Calculate user and assistant characters
  let totalUserChars = 0
  let totalAssistantChars = 0

  messages.forEach((msg) => {
    const parts = msg.parts || []
    if (msg.role === "user") {
      parts.forEach((part: any) => {
        if (part.type === "text") {
          totalUserChars += part.text?.length || 0
        }
      })
    } else if (msg.role === "assistant") {
      parts.forEach((part: any) => {
        if (part.type === "text") {
          totalAssistantChars += part.text?.length || 0
        }
      })
    }
  })

  const totalConversationChars = totalUserChars + totalAssistantChars
  const userTokenRatio = totalConversationChars > 0 ? totalUserChars / totalConversationChars : 0
  const assistantTokenRatio = totalConversationChars > 0 ? totalAssistantChars / totalConversationChars : 0

  const userTokens = Math.round(conversationLength * userTokenRatio)
  const assistantTokens = Math.round(conversationLength * assistantTokenRatio)

  return {
    tokensTotal: total,
    conversationLength,
    instructionTokens: estimatedSystemTokens,
    totalUserTokens: userTokens,
    totalAssistantTokens: assistantTokens,
    compactionEvents,
  }
}

describe("Token Calculation Consistency Tests", () => {
  test("TUI sidebar and web Share component should calculate identical tokens", () => {
    const messages = createMockMessages()
    const models = createMockModels()

    // Calculate using the component logic
    const componentCalculation = calculateTokensLikeComponents(messages, models)

    // Calculate using the utility function
    const utilityCalculation = computeTokenMetrics(messages, models)

    if (!utilityCalculation) {
      throw new Error("Utility function returned null")
    }

    // Verify total tokens match
    expect(componentCalculation.tokensTotal).toBe(utilityCalculation.tokensTotal)

    // Verify conversation length calculation
    expect(componentCalculation.conversationLength).toBeGreaterThan(0)
    expect(componentCalculation.instructionTokens).toBeGreaterThan(0)

    // Verify user/assistant token distribution
    expect(componentCalculation.totalUserTokens + componentCalculation.totalAssistantTokens).toBeLessThanOrEqual(
      componentCalculation.conversationLength,
    )

    // Verify compaction events
    expect(componentCalculation.compactionEvents).toBe(0) // No summary messages in mock data
  })

  test("character-based token distribution should be proportional", () => {
    const messages = [
      {
        id: "msg1",
        role: "user" as const,
        parts: [
          { type: "text", text: "Short user message" }, // 17 chars
        ],
      },
      {
        id: "msg2",
        role: "assistant" as const,
        parts: [
          {
            type: "text",
            text: "This is a much longer assistant response with significantly more characters to test proportional distribution",
          }, // 105 chars
        ],
        tokens: { input: 10, output: 20, reasoning: 5, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        system: ["System prompt"],
      },
    ]

    const result = calculateTokensLikeComponents(messages, createMockModels())

    // Assistant should have more tokens due to longer message
    expect(result.totalAssistantTokens).toBeGreaterThan(result.totalUserTokens)

    // The ratio should roughly match the character ratio
    const expectedRatio = 105 / (17 + 105) // ~86%
    const actualRatio = result.totalAssistantTokens / (result.totalUserTokens + result.totalAssistantTokens)

    // Allow for rounding differences
    expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.1)
  })

  test("system prompt token estimation should be consistent", () => {
    const systemPrompt = "You are a helpful assistant with specific instructions."
    const expectedTokens = Math.round(systemPrompt.length / 4)

    const messages = [
      {
        id: "msg1",
        role: "assistant" as const,
        parts: [{ type: "text", text: "Response" }],
        tokens: { input: 10, output: 10, reasoning: 0, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        system: [systemPrompt],
      },
    ]

    const result = calculateTokensLikeComponents(messages, createMockModels())

    expect(result.instructionTokens).toBe(expectedTokens)
    expect(result.conversationLength).toBe(20 - expectedTokens) // 20 total tokens minus system tokens
  })

  test("compaction events should be counted correctly", () => {
    const messages = [
      {
        id: "msg1",
        role: "assistant" as const,
        parts: [{ type: "text", text: "Regular response" }],
        tokens: { input: 5, output: 5, reasoning: 0, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        summary: false,
      },
      {
        id: "msg2",
        role: "assistant" as const,
        parts: [{ type: "text", text: "Summary response" }],
        tokens: { input: 3, output: 3, reasoning: 0, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        summary: true,
      },
      {
        id: "msg3",
        role: "assistant" as const,
        parts: [{ type: "text", text: "Another summary" }],
        tokens: { input: 2, output: 2, reasoning: 0, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        summary: true,
      },
    ]

    const result = calculateTokensLikeComponents(messages, createMockModels())

    expect(result.compactionEvents).toBe(2)
  })

  test("edge case: empty conversation should return zeros", () => {
    const result = calculateTokensLikeComponents([], createMockModels())

    expect(result.tokensTotal).toBe(0)
    expect(result.conversationLength).toBe(0)
    expect(result.instructionTokens).toBe(0)
    expect(result.totalUserTokens).toBe(0)
    expect(result.totalAssistantTokens).toBe(0)
    expect(result.compactionEvents).toBe(0)
  })

  test("edge case: conversation with only user messages should return zeros", () => {
    const messages = [
      {
        id: "msg1",
        role: "user" as const,
        parts: [{ type: "text", text: "User message only" }],
      },
    ]

    const result = calculateTokensLikeComponents(messages, createMockModels())

    expect(result.tokensTotal).toBe(0)
    expect(result.conversationLength).toBe(0)
    expect(result.instructionTokens).toBe(0)
    expect(result.totalUserTokens).toBe(0)
    expect(result.totalAssistantTokens).toBe(0)
    expect(result.compactionEvents).toBe(0)
  })
})
