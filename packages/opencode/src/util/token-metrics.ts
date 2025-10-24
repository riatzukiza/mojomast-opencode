export function computeTokenMetrics(messages: any[], models: any = {}) {
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
