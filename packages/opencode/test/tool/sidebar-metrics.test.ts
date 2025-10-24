import { describe, expect, test } from "bun:test"

// Pure helper mirroring the token metrics logic from the Sidebar component
function computeMetrics(messages: any[], models: any = {}) {
  // total assistant tokens (sum of input + output + reasoning across assistant messages)
  const total = messages.reduce((sum, x) => {
    if (x.role === "assistant") {
      const tIn = x.tokens?.input ?? 0
      const tOut = x.tokens?.output ?? 0
      const tReason = x.tokens?.reasoning ?? 0
      return sum + tIn + tOut + tReason
    }
    return sum
  }, 0)

  // total cost for assistant messages
  const cost = messages.reduce((sum, x) => {
    if (x.role === "assistant") {
      return sum + (x.cost ?? 0)
    }
    return sum
  }, 0)

  // last assistant message with positive output to compute context usage
  const last = [...messages].reverse().find((m) => m.role === "assistant" && (m.tokens?.output ?? 0) > 0)
  let percentage: number | null = null
  if (last) {
    const totalTokens =
      (last.tokens?.input ?? 0) +
      (last.tokens?.output ?? 0) +
      (last.tokens?.reasoning ?? 0) +
      (last.tokens?.cache?.read ?? 0) +
      (last.tokens?.cache?.write ?? 0)

    const modelContainer =
      last.providerID && last.modelID ? (models[last.providerID]?.models?.[last.modelID] ?? null) : null
    const limit = modelContainer?.limit?.context ?? null
    if (limit) {
      percentage = Math.round((totalTokens / limit) * 100)
    }
  }

  // total tokens used for requests (sum of input+output+reasoning for assistant messages)
  const requestTokens = messages.reduce((sum, x) => {
    if (x.role === "assistant") {
      const tIn = x.tokens?.input ?? 0
      const tOut = x.tokens?.output ?? 0
      const tReason = x.tokens?.reasoning ?? 0
      return sum + tIn + tOut + tReason
    }
    return sum
  }, 0)

  return {
    tokensTotal: total,
    requestTokensTotal: requestTokens,
    costTotal: cost,
    percentage: percentage,
  }
}

describe("sidebar token metrics (mirrored)", () => {
  test("computes metrics for sample messages with a limit", () => {
    const messages = [
      {
        role: "user",
        tokens: { input: 0, output: 0, reasoning: 0 },
        cost: 0,
        providerID: "p1",
        modelID: "m1",
      },
      {
        role: "assistant",
        tokens: { input: 10, output: 5, reasoning: 2 },
        cost: 1,
        providerID: "p1",
        modelID: "m1",
      },
      {
        role: "user",
        tokens: { input: 0, output: 0, reasoning: 0 },
      },
      {
        role: "assistant",
        tokens: { input: 20, output: 5, reasoning: 5 },
        cost: 2,
        providerID: "p1",
        modelID: "m1",
      },
    ]

    const models = {
      p1: { models: { m1: { limit: { context: 200 } } } },
    }

    const res = computeMetrics(messages, models)
    expect(res.tokensTotal).toBe(47) // (10+5+2) + (20+5+5)
    expect(res.requestTokensTotal).toBe(47)
    expect(res.costTotal).toBe(3)
    expect(res.percentage).toBe(15)
  })

  test("handles missing model limit gracefully (no percentage)", () => {
    const messages = [
      {
        role: "assistant",
        tokens: { input: 3, output: 1, reasoning: 1 },
        cost: 0.5,
        providerID: "p1",
        modelID: "m1",
      },
    ]

    // Model data exists but without a context limit to trigger null percentage
    const models = {
      p1: {
        models: {
          m1: {
            /* no limit */
          },
        },
      },
    }

    const res = computeMetrics(messages, models)
    expect(res.tokensTotal).toBe(5)
    expect(res.requestTokensTotal).toBe(5)
    expect(res.costTotal).toBe(0.5)
    expect(res.percentage).toBeNull()
  })
})
