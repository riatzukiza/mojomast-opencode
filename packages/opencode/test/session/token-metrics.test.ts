import { describe, expect, test } from "bun:test"
import {
  summarizeContext,
  summarizeRequestTokens,
  type PartInfo,
  type TokenMessage,
} from "../../src/session/token-metrics"

function makeTokens(values: {
  input: number
  output: number
  reasoning: number
  cache?: { read: number; write: number }
}): TokenMessage["tokens"] {
  return {
    input: values.input,
    output: values.output,
    reasoning: values.reasoning,
    cache: values.cache ?? { read: 0, write: 0 },
  }
}

describe("summarizeRequestTokens", () => {
  test("sums assistant token usage only", () => {
    const msgs: TokenMessage[] = [
      { id: "u1", role: "user", tokens: makeTokens({ input: 5, output: 0, reasoning: 0 }) },
      {
        id: "a1",
        role: "assistant",
        tokens: makeTokens({ input: 10, output: 5, reasoning: 2 }),
      },
      {
        id: "a2",
        role: "assistant",
        tokens: makeTokens({ input: 3, output: 1, reasoning: 4 }),
      },
    ]

    const totals = summarizeRequestTokens(msgs)

    expect(totals).toStrictEqual({ input: 13, output: 6, reasoning: 6, total: 25 })
  })
})

describe("summarizeContext", () => {
  test("produces context metrics for active conversation", () => {
    const msgs: TokenMessage[] = [
      { id: "u1", role: "user", tokens: makeTokens({ input: 0, output: 0, reasoning: 0 }) },
      {
        id: "a1",
        role: "assistant",
        tokens: makeTokens({ input: 50, output: 20, reasoning: 10, cache: { read: 5, write: 5 } }),
        summary: true,
      },
      { id: "u2", role: "user", tokens: makeTokens({ input: 0, output: 0, reasoning: 0 }) },
      {
        id: "a2",
        role: "assistant",
        tokens: makeTokens({ input: 60, output: 30, reasoning: 20, cache: { read: 4, write: 6 } }),
        system: ["x".repeat(40)],
      },
    ]

    const parts: Record<string, PartInfo[]> = {
      u1: [{ type: "text", text: "u".repeat(50) }],
      a1: [{ type: "text", text: "a".repeat(60) }],
      u2: [{ type: "text", text: "u".repeat(30) }],
      a2: [{ type: "text", text: "a".repeat(90) }],
    }

    const summary = summarizeContext({
      messages: msgs,
      partsFor: (id) => parts[id] ?? [],
      last: msgs.at(-1),
      contextLimit: 400,
    })

    expect(summary.tokens).toBe(120)
    expect(summary.compactionEvents).toBe(1)
    expect(summary.instructionTokens).toBe(10)
    expect(summary.conversationLength).toBe(110)
    expect(summary.totalUserTokens).toBe(38)
    expect(summary.totalAssistantTokens).toBe(72)
    expect(summary.totalUserChars).toBe(80)
    expect(summary.totalAssistantChars).toBe(150)
    expect(summary.percentage).toBe(30)
  })

  test("returns zero metrics when assistant output tokens are missing", () => {
    const msgs: TokenMessage[] = [
      { id: "u1", role: "user", tokens: makeTokens({ input: 0, output: 0, reasoning: 0 }) },
      {
        id: "a1",
        role: "assistant",
        tokens: makeTokens({ input: 5, output: 0, reasoning: 1 }),
      },
    ]

    const summary = summarizeContext({
      messages: msgs,
      partsFor: () => [],
    })

    expect(summary).toStrictEqual({
      tokens: 0,
      percentage: null,
      compactionEvents: 0,
      conversationLength: 0,
      instructionTokens: 0,
      totalUserTokens: 0,
      totalAssistantTokens: 0,
      totalUserChars: 0,
      totalAssistantChars: 0,
    })
  })

  test("clamps conversation length when system tokens exceed total", () => {
    const msgs: TokenMessage[] = [
      {
        id: "a1",
        role: "assistant",
        tokens: makeTokens({ input: 6, output: 4, reasoning: 0, cache: { read: 0, write: 0 } }),
        system: ["z".repeat(160)],
      },
    ]

    const parts: Record<string, PartInfo[]> = {
      a1: [{ type: "text", text: "assistant".repeat(5) }],
    }

    const summary = summarizeContext({
      messages: msgs,
      partsFor: (id) => parts[id] ?? [],
      contextLimit: 100,
    })

    expect(summary.tokens).toBe(10)
    expect(summary.instructionTokens).toBe(40)
    expect(summary.conversationLength).toBe(0)
    expect(summary.totalUserTokens).toBe(0)
    expect(summary.totalAssistantTokens).toBe(0)
    expect(summary.totalAssistantChars).toBe("assistant".length * 5)
    expect(summary.totalUserChars).toBe(0)
    expect(summary.percentage).toBe(10)
  })
})
