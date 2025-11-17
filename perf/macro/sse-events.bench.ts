import { Server } from "@/server/server"
import { ensurePerfEnv, loadScenarioBody, createSession, writePerfResult } from "./utils"

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const messageCount = asNumber(process.env.PERF_STREAM_MESSAGES, 3)
const settleMs = asNumber(process.env.PERF_STREAM_SETTLE_MS, 2000)
const resultFile = "macro-sse-events.json"

type RunMetric = {
  index: number
  sendTs: number
  assistantID?: string
  firstEventTs?: number
  lastEventTs?: number
  eventCount: number
  completedTs?: number
  responseMs?: number
}

type SSEPayload = {
  type: string
  properties: Record<string, any>
}

const main = async () => {
  ensurePerfEnv()
  const server = Server.listen({ port: 0, hostname: "127.0.0.1" })
  try {
    const baseURL = `http://127.0.0.1:${server.port}`
    const sessionID = await createSession(baseURL)
    const baseBody = await loadScenarioBody()
    const runs: RunMetric[] = []
    const runByAssistant = new Map<string, RunMetric>()
    const stats = { events: 0 }
    const controller = new AbortController()
    const sseTask = streamEvents(`${baseURL}/event`, controller.signal, (payload) => {
      stats.events++
      handleSSE(payload, runs, runByAssistant)
    })
    for (let index = 0; index < messageCount; index++) {
      const run = startRun(index, runs)
      const body = buildPayload(baseBody, index)
      await sendMessage(baseURL, sessionID, body, run, runByAssistant)
    }
    await waitFor(() => runs.every((run) => run.completedTs !== undefined), settleMs)
    controller.abort()
    await sseTask.catch((error) => {
      if (!isAbortError(error)) {
        throw error
      }
    })
    const metrics = summarizeRuns(runs, stats.events)
    await writePerfResult(resultFile, {
      suite: "macro",
      name: "sse-event-stream",
      metrics,
      meta: {
        node: process.version,
        bun: Bun.version,
        messages: messageCount,
        settleMs,
        sessionID,
      },
    })
    console.table(metrics)
  } finally {
    server.stop()
  }
}

const startRun = (index: number, runs: RunMetric[]) => {
  const run: RunMetric = { index, sendTs: performance.now(), eventCount: 0 }
  runs[index] = run
  return run
}

const buildPayload = (base: Record<string, unknown>, index: number) => {
  const clone = JSON.parse(JSON.stringify(base)) as Record<string, unknown>
  const parts = Array.isArray(clone.parts) ? (clone.parts as Record<string, unknown>[]) : []
  const message = `Perf streaming message ${index + 1}`
  const textPart = parts.find((part) => part?.type === "text")
  if (textPart) {
    textPart.text = message
  } else {
    clone.parts = [...parts, { type: "text", text: message }]
  }
  return JSON.stringify(clone)
}

const sendMessage = async (
  baseURL: string,
  sessionID: string,
  body: string,
  run: RunMetric,
  runByAssistant: Map<string, RunMetric>,
) => {
  const res = await fetch(`${baseURL}/session/${sessionID}/message`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body,
  })
  if (!res.ok) {
    throw new Error(`message request failed: ${res.status}`)
  }
  const data = (await res.json()) as { info: { id: string } }
  run.completedTs = performance.now()
  run.responseMs = run.completedTs - run.sendTs
  if (data.info?.id) {
    run.assistantID = data.info.id
    runByAssistant.set(data.info.id, run)
  }
}

const streamEvents = async (url: string, signal: AbortSignal, onEvent: (payload: SSEPayload) => void) => {
  const res = await fetch(url, {
    headers: {
      accept: "text/event-stream",
    },
    signal,
  })
  if (!res.ok || !res.body) {
    throw new Error(`failed to subscribe to SSE: ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const chunk = await reader.read()
    if (chunk.done) break
    buffer += decoder.decode(chunk.value, { stream: true })
    let index: number
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, index)
      buffer = buffer.slice(index + 2)
      const payload = parseEventBlock(block)
      if (payload) onEvent(payload)
    }
  }
}

const parseEventBlock = (block: string): SSEPayload | undefined => {
  const dataLines = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
  if (!dataLines.length) return undefined
  try {
    return JSON.parse(dataLines.join("\n")) as SSEPayload
  } catch {
    return undefined
  }
}

const handleSSE = (payload: SSEPayload, runs: RunMetric[], runByAssistant: Map<string, RunMetric>) => {
  if (payload.type === "message.updated") {
    const info = payload.properties?.info as { id?: string; role?: string }
    if (info?.role === "assistant" && info.id) {
      const existing = runByAssistant.get(info.id)
      if (existing) return
      const pending = runs.find((run) => !run.assistantID)
      if (pending) {
        pending.assistantID = info.id
        runByAssistant.set(info.id, pending)
      }
    }
    return
  }
  if (payload.type === "message.part.updated") {
    const part = payload.properties?.part as { messageID?: string }
    if (!part?.messageID) return
    const run = runByAssistant.get(part.messageID)
    if (!run) return
    const now = performance.now()
    run.eventCount += 1
    if (run.firstEventTs === undefined) {
      run.firstEventTs = now
    }
    run.lastEventTs = now
  }
}

const waitFor = async (predicate: () => boolean, timeoutMs: number) => {
  const start = performance.now()
  while (performance.now() - start < timeoutMs) {
    if (predicate()) return true
    await Bun.sleep(25)
  }
  return false
}

const summarizeRuns = (runs: RunMetric[], eventsTotal: number) => {
  const ttfb: number[] = runs.map((run) =>
    run.firstEventTs !== undefined ? run.firstEventTs - run.sendTs : (run.responseMs ?? 0),
  )
  const completion: number[] = runs.map((run) => run.responseMs ?? 0)
  const streamDurations: number[] = runs.map((run) =>
    run.firstEventTs !== undefined && run.lastEventTs !== undefined ? run.lastEventTs - run.firstEventTs : 0,
  )
  const eventsPerRun: number[] = runs.map((run) => run.eventCount)
  return {
    ttfbAvg: average(ttfb),
    ttfbP95: percentile(ttfb, 0.95),
    completionAvg: average(completion),
    completionP95: percentile(completion, 0.95),
    streamDurationAvg: average(streamDurations),
    eventsPerMessageAvg: average(eventsPerRun),
    zeroEventMessages: runs.filter((run) => run.eventCount === 0).length,
    eventsTotal,
  }
}

const average = (values: number[]): number => {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const percentile = (values: number[], ratio: number): number => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(ratio * (sorted.length - 1))))
  return sorted[index] ?? 0
}

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === "AbortError"

main().catch((error) => {
  console.error("macro sse bench failed", error)
  process.exit(1)
})
