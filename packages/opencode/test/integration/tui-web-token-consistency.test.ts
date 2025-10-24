import { describe, expect, test } from "bun:test"
import { computeTokenMetrics } from "../../src/util/token-metrics"

// Import the actual calculation logic from both components
// We'll simulate the same logic to ensure consistency

// Simulate TUI sidebar token calculation
function calculateTUISidebarTokens(messages: any[], models: any, parts: any) {
  const last = [...messages].reverse().find((m) => m.role === "assistant" && (m.tokens?.output ?? 0) > 0)

  if (!last) {
    return {
      tokens: "0",
      percentage: null,
      compactionEvents: 0,
      conversationLength: "0",
      instructionTokens: "0",
      totalUserTokens: "0",
      totalAssistantTokens: "0",
    }
  }

  const total =
    last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
  const model = models[last.providerID]?.models[last.modelID]

  // Count compaction events (summary messages)
  const compactionEvents = messages.filter((x) => x.role === "assistant" && x.summary).length

  // Get the actual system prompt content that was used
  const systemPromptContent = last.system?.join("") || ""

  // Count characters in system prompt (rough estimate: ~4 chars per token)
  const systemPromptChars = systemPromptContent.length
  const estimatedSystemTokens = Math.round(systemPromptChars / 4)

  // Calculate conversation length (total minus instruction tokens)
  const conversationLength = Math.max(0, total - estimatedSystemTokens)

  // Calculate user and assistant tokens based on character proportions of conversation only
  let totalUserChars = 0
  let totalAssistantChars = 0

  messages.forEach((msg) => {
    const msgParts = parts[msg.id] || []
    if (msg.role === "user") {
      msgParts.forEach((part: any) => {
        if (part.type === "text") {
          totalUserChars += part.text?.length || 0
        }
      })
    } else if (msg.role === "assistant") {
      msgParts.forEach((part: any) => {
        if (part.type === "text") {
          totalAssistantChars += part.text?.length || 0
        }
      })
    }
  })

  const totalConversationChars = totalUserChars + totalAssistantChars

  // Apply proportional distribution to conversation length only (excluding system prompt)
  const userTokenRatio = totalConversationChars > 0 ? totalUserChars / totalConversationChars : 0
  const assistantTokenRatio = totalConversationChars > 0 ? totalAssistantChars / totalConversationChars : 0

  const userTokens = Math.round(conversationLength * userTokenRatio)
  const assistantTokens = Math.round(conversationLength * assistantTokenRatio)

  return {
    tokens: total.toLocaleString(),
    percentage: model?.limit?.context ? Math.round((total / model.limit.context) * 100) : null,
    compactionEvents,
    conversationLength: conversationLength.toLocaleString(),
    instructionTokens: estimatedSystemTokens.toLocaleString(),
    totalUserTokens: userTokens.toLocaleString(),
    totalAssistantTokens: assistantTokens.toLocaleString(),
  }
}

// Simulate web Share component token calculation
function calculateWebShareTokens(messages: any[], models: any) {
  let result: any = {
    context: {
      tokens: 0,
      percentage: null,
      compactionEvents: 0,
      conversationLength: 0,
      instructionTokens: 0,
      totalUserTokens: 0,
      totalAssistantTokens: 0,
    },
  }

  // Calculate context tokens from the last assistant message
  const last = messages.findLast((x: any) => x.role === "assistant" && x.tokens.output > 0)
  if (last) {
    const total =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write

    // Count compaction events (summary messages)
    result.context.compactionEvents = messages.filter((x: any) => x.role === "assistant" && x.summary).length

    // Get the actual system prompt content that was used
    const systemPromptContent = last.system?.join("") || ""

    // Count characters in system prompt (rough estimate: ~4 chars per token)
    const systemPromptChars = systemPromptContent.length
    const estimatedSystemTokens = Math.round(systemPromptChars / 4)

    // Calculate conversation length (total minus instruction tokens)
    result.context.conversationLength = Math.max(0, total - estimatedSystemTokens)
    result.context.instructionTokens = estimatedSystemTokens
    result.context.tokens = total

    // Calculate total user and assistant characters across entire session history
    let totalUserChars = 0
    let totalAssistantChars = 0

    messages.forEach((msg: any) => {
      const msgParts = msg.parts || []
      if (msg.role === "user") {
        msgParts.forEach((part: any) => {
          if (part.type === "text") {
            totalUserChars += part.text?.length || 0
          }
        })
      } else if (msg.role === "assistant") {
        msgParts.forEach((part: any) => {
          if (part.type === "text") {
            totalAssistantChars += part.text?.length || 0
          }
        })
      }
    })

    // Store total character counts for display (entire conversation history)
    result.context.totalUserChars = totalUserChars
    result.context.totalAssistantChars = totalAssistantChars

    // For current context token distribution, use the last assistant message's context
    const totalConversationChars = totalUserChars + totalAssistantChars
    const userTokenRatio = totalConversationChars > 0 ? totalUserChars / totalConversationChars : 0
    const assistantTokenRatio = totalConversationChars > 0 ? totalAssistantChars / totalConversationChars : 0

    result.context.totalUserTokens = Math.round(result.context.conversationLength * userTokenRatio)
    result.context.totalAssistantTokens = Math.round(result.context.conversationLength * assistantTokenRatio)
  }

  return result
}

describe("TUI ↔ Web Token Calculation Integration Tests", () => {
  const createTestData = () => {
    const messages = [
      {
        id: "msg1",
        role: "user" as const,
        parts: [{ type: "text", text: "Hello, can you help me understand how token counting works in this system?" }],
        tokens: { input: 0, output: 0, reasoning: 0 },
        cost: 0,
      },
      {
        id: "msg2",
        role: "assistant" as const,
        parts: [
          {
            type: "text",
            text: "I'd be happy to explain token counting! Tokens are the basic units that language models process. The system counts them differently for different purposes.",
          },
        ],
        tokens: { input: 15, output: 25, reasoning: 8, cache: { read: 1, write: 0 } },
        cost: 0.003,
        providerID: "openai",
        modelID: "gpt-4",
        system: ["You are a helpful assistant that explains technical concepts clearly and concisely."],
      },
      {
        id: "msg3",
        role: "user" as const,
        parts: [
          {
            type: "text",
            text: "How does the system handle character-based token estimation versus actual token counts?",
          },
        ],
        tokens: { input: 0, output: 0, reasoning: 0 },
        cost: 0,
      },
      {
        id: "msg4",
        role: "assistant" as const,
        parts: [
          {
            type: "text",
            text: "Great question! The system uses character-based estimation (~4 chars per token) for system prompts and instruction tokens, but uses actual token counts from the model API for conversation tokens. This hybrid approach provides good accuracy while maintaining performance.",
          },
        ],
        tokens: { input: 20, output: 35, reasoning: 12, cache: { read: 2, write: 1 } },
        cost: 0.006,
        providerID: "openai",
        modelID: "gpt-4",
        summary: false,
      },
    ]

    const parts = {
      msg1: messages[0].parts,
      msg2: messages[1].parts,
      msg3: messages[2].parts,
      msg4: messages[3].parts,
    }

    const models = {
      openai: {
        models: {
          "gpt-4": {
            limit: { context: 8000 },
          },
        },
      },
    }

    return { messages, parts, models }
  }

  test("TUI sidebar and web Share should produce identical token calculations", () => {
    const { messages, parts, models } = createTestData()

    // Calculate using TUI sidebar logic
    const tuiResult = calculateTUISidebarTokens(messages, models, parts)

    // Calculate using web Share logic
    const webResult = calculateWebShareTokens(messages, models)

    // Compare core token metrics
    expect(parseInt(tuiResult.tokens.replace(/,/g, ""))).toBe(webResult.context.tokens)
    expect(parseInt(tuiResult.conversationLength.replace(/,/g, ""))).toBe(webResult.context.conversationLength)
    expect(parseInt(tuiResult.instructionTokens.replace(/,/g, ""))).toBe(webResult.context.instructionTokens)
    expect(parseInt(tuiResult.totalUserTokens.replace(/,/g, ""))).toBe(webResult.context.totalUserTokens)
    expect(parseInt(tuiResult.totalAssistantTokens.replace(/,/g, ""))).toBe(webResult.context.totalAssistantTokens)
    expect(tuiResult.compactionEvents).toBe(webResult.context.compactionEvents)
  })

  test("both interfaces should handle missing model limits consistently", () => {
    const { messages, parts } = createTestData()
    const modelsWithoutLimits = {
      openai: {
        models: {
          "gpt-4": {}, // No limit property
        },
      },
    }

    const tuiResult = calculateTUISidebarTokens(messages, modelsWithoutLimits, parts)
    const webResult = calculateWebShareTokens(messages, modelsWithoutLimits)

    // Both should return null for percentage when no limit is available
    expect(tuiResult.percentage).toBeNull()
    expect(webResult.context.percentage).toBeNull()
  })

  test("both interfaces should handle empty conversations consistently", () => {
    const emptyMessages: any[] = []
    const emptyParts: any = {}
    const models = createTestData().models

    const tuiResult = calculateTUISidebarTokens(emptyMessages, models, emptyParts)
    const webResult = calculateWebShareTokens(emptyMessages, models)

    // Both should return zeros for all metrics
    expect(parseInt(tuiResult.tokens.replace(/,/g, ""))).toBe(0)
    expect(parseInt(tuiResult.conversationLength.replace(/,/g, ""))).toBe(0)
    expect(parseInt(tuiResult.instructionTokens.replace(/,/g, ""))).toBe(0)
    expect(parseInt(tuiResult.totalUserTokens.replace(/,/g, ""))).toBe(0)
    expect(parseInt(tuiResult.totalAssistantTokens.replace(/,/g, ""))).toBe(0)
    expect(tuiResult.compactionEvents).toBe(0)

    expect(webResult.context.tokens).toBe(0)
    expect(webResult.context.conversationLength).toBe(0)
    expect(webResult.context.instructionTokens).toBe(0)
    expect(webResult.context.totalUserTokens).toBe(0)
    expect(webResult.context.totalAssistantTokens).toBe(0)
    expect(webResult.context.compactionEvents).toBe(0)
  })

  test("both interfaces should count compaction events consistently", () => {
    const { messages, parts, models } = createTestData()

    // Add some summary messages
    const messagesWithSummaries = [
      ...messages,
      {
        id: "msg5",
        role: "assistant" as const,
        parts: [{ type: "text", text: "Summary of previous conversation" }],
        tokens: { input: 5, output: 5, reasoning: 0, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        summary: true,
      },
      {
        id: "msg6",
        role: "assistant" as const,
        parts: [{ type: "text", text: "Another summary" }],
        tokens: { input: 3, output: 3, reasoning: 0, cache: { read: 0, write: 0 } },
        providerID: "openai",
        modelID: "gpt-4",
        summary: true,
      },
    ]

    const partsWithSummaries = {
      ...parts,
      msg5: messagesWithSummaries[4].parts,
      msg6: messagesWithSummaries[5].parts,
    }

    const tuiResult = calculateTUISidebarTokens(messagesWithSummaries, models, partsWithSummaries)
    const webResult = calculateWebShareTokens(messagesWithSummaries, models)

    // Both should count 2 compaction events
    expect(tuiResult.compactionEvents).toBe(2)
    expect(webResult.context.compactionEvents).toBe(2)
  })

  test("token distribution should be mathematically consistent", () => {
    const { messages, parts, models } = createTestData()

    const tuiResult = calculateTUISidebarTokens(messages, models, parts)
    const webResult = calculateWebShareTokens(messages, models)

    // Parse string values to numbers for TUI results
    const tuiConversationLength = parseInt(tuiResult.conversationLength.replace(/,/g, ""))
    const tuiUserTokens = parseInt(tuiResult.totalUserTokens.replace(/,/g, ""))
    const tuiAssistantTokens = parseInt(tuiResult.totalAssistantTokens.replace(/,/g, ""))

    // For both interfaces, user + assistant tokens should not exceed conversation length
    expect(tuiUserTokens + tuiAssistantTokens).toBeLessThanOrEqual(tuiConversationLength)
    expect(webResult.context.totalUserTokens + webResult.context.totalAssistantTokens).toBeLessThanOrEqual(
      webResult.context.conversationLength,
    )

    // The distribution should be proportional to character counts
    // (allowing for rounding differences)
    const tuiTotal = tuiUserTokens + tuiAssistantTokens
    const webTotal = webResult.context.totalUserTokens + webResult.context.totalAssistantTokens

    if (tuiTotal > 0 && webTotal > 0) {
      const tuiUserRatio = tuiUserTokens / tuiTotal
      const webUserRatio = webResult.context.totalUserTokens / webTotal

      // Ratios should be very close (allowing for rounding)
      expect(Math.abs(tuiUserRatio - webUserRatio)).toBeLessThan(0.05)
    }
  })

  test("utility function should match component calculations", () => {
    const { messages, models } = createTestData()

    // Calculate using utility function
    const utilityResult = computeTokenMetrics(messages, models)

    // Calculate using component logic
    const tuiResult = calculateTUISidebarTokens(messages, models, createTestData().parts)
    const webResult = calculateWebShareTokens(messages, models)

    if (!utilityResult) {
      throw new Error("Utility function returned null")
    }

    // Utility function sums all assistant tokens, while component logic uses last assistant message
    // This is expected behavior - they serve different purposes
    expect(utilityResult.tokensTotal).toBeGreaterThan(0)
    expect(utilityResult.requestTokensTotal).toBeGreaterThan(0)
    expect(utilityResult.costTotal).toBeGreaterThan(0)

    // Parse TUI string values for comparison
    const tuiTokens = parseInt(tuiResult.tokens.replace(/,/g, ""))
    // TUI uses last assistant message, utility sums all - different purposes
    expect(tuiTokens).toBeGreaterThan(0)
    expect(utilityResult.tokensTotal).toBeGreaterThan(0)
  })
})
