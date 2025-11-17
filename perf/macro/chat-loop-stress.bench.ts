import { Server } from "@/server/server"
import {
  ensurePerfEnv,
  loadScenarioBody,
  createSession,
  writePerfResult,
  prepareStubWorkspace,
  cleanupStubWorkspace,
} from "./utils"
import { Hotspots } from "../hotspots"

const numberEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const SESSIONS = numberEnv(process.env.PERF_SESSIONS, 4)
const MESSAGES_PER_SESSION = numberEnv(process.env.PERF_MESSAGES, 25)
const CONCURRENCY = numberEnv(process.env.PERF_CONCURRENCY, 8)
const SHARED_SESSION = process.env.PERF_SHARED_SESSION === "1"
const RESULT_FILE = "macro-chat-loop-stress.json"

const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

type JobResult = {
  duration: number
  error?: string
}

type DurationStats = {
  avg: number
  p50: number
  p95: number
  p99: number
  max: number
}

const main = async () => {
  ensurePerfEnv()
  Hotspots.setEnabled(true)
  Hotspots.reset()
  await prepareStubWorkspace()

  const server = Server.listen({ port: 0, hostname: "127.0.0.1" })
  try {
    const baseURL = `http://127.0.0.1:${server.port}`
    const payload = await loadScenarioBody()
    const body = JSON.stringify(payload)
    const sessions = await createSessions(baseURL)
    const jobs = buildJobs({ sessions, messages: MESSAGES_PER_SESSION })
    const summary = await runBenchmark({ baseURL, body, jobs })
    await writePerfResult(RESULT_FILE, {
      suite: "macro",
      name: "chat-loop-stress",
      metrics: summary.metrics,
      meta: summary.meta,
    })
    console.table(summary.display)
  } finally {
    server.stop()
    await cleanupStubWorkspace().catch(() => {})
  }
}

const createSessions = async (baseURL: string) => {
  const required = SHARED_SESSION ? 1 : Math.max(SESSIONS, 1)
  const ids = await Promise.all(Array.from({ length: required }, () => createSession(baseURL)))
  if (SHARED_SESSION) {
    const shared = ids[0]
    if (!shared) {
      throw new Error("failed to create shared session")
    }
    return Array.from({ length: Math.max(SESSIONS, 1) }, () => shared)
  }
  return ids
}

const buildJobs = (input: { sessions: string[]; messages: number }) => {
  const jobs: Array<{ sessionID: string; index: number }> = []
  input.sessions.forEach((sessionID) => {
    for (let i = 0; i < input.messages; i++) {
      jobs.push({ sessionID, index: i })
    }
  })
  return jobs
}

const runBenchmark = async (input: {
  baseURL: string
  body: string
  jobs: Array<{ sessionID: string; index: number }>
}) => {
  if (input.jobs.length === 0) {
    return {
      metrics: {},
      meta: {},
      display: [],
    }
  }
  const startWall = nowMs()
  const jobResults = await runWithConcurrency(CONCURRENCY, input.jobs, (job) =>
    sendMessage({ baseURL: input.baseURL, sessionID: job.sessionID, body: input.body }),
  )
  const endWall = nowMs()

  const durations = jobResults.filter((job) => !job.error).map((job) => job.duration)
  const errors = jobResults.filter((job) => job.error).length
  const stats = summarizeDurations(durations)
  const totalMessages = jobResults.length
  const elapsedMs = endWall - startWall
  const throughput = totalMessages > 0 ? durations.length / (elapsedMs / 1000 || 1) : 0
  const hotspotSnapshot = Hotspots.snapshot()

  const metrics: Record<string, number> = {
    avgMs: stats.avg,
    p50Ms: stats.p50,
    p95Ms: stats.p95,
    p99Ms: stats.p99,
    maxMs: stats.max,
    successes: durations.length,
    errors,
    throughput,
    totalMessages,
  }

  const uniqueSessions = new Set(input.jobs.map((job) => job.sessionID)).size

  const meta: Record<string, string | number> = {
    node: process.version,
    bun: Bun.version,
    sessions: uniqueSessions,
    messagesPerSession: MESSAGES_PER_SESSION,
    concurrency: CONCURRENCY,
    sharedSession: SHARED_SESSION ? 1 : 0,
    totalDurationMs: Math.round(elapsedMs),
    hotspotsEnabled: hotspotSnapshot.enabled ? 1 : 0,
    hotspots: JSON.stringify(hotspotSnapshot.metrics),
  }

  const display = [
    {
      avgMs: Number(stats.avg.toFixed(2)),
      p50Ms: Number(stats.p50.toFixed(2)),
      p95Ms: Number(stats.p95.toFixed(2)),
      p99Ms: Number(stats.p99.toFixed(2)),
      maxMs: Number(stats.max.toFixed(2)),
      successes: durations.length,
      errors,
      throughput: Number(throughput.toFixed(2)),
    },
  ]

  return {
    metrics,
    meta,
    display,
  }
}

async function sendMessage(input: { baseURL: string; sessionID: string; body: string }) {
  return Hotspots.timed("macro.chat_loop_stress.message", async () => {
    const started = nowMs()
    const res = await fetch(`${input.baseURL}/session/${input.sessionID}/message`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: input.body,
    })
    if (!res.ok) {
      throw new Error(`message failed: ${res.status}`)
    }
    await res.json().catch(() => undefined)
    return nowMs() - started
  })
}

const runWithConcurrency = async (
  limit: number,
  jobs: Array<{ sessionID: string; index: number }>,
  runner: (job: { sessionID: string; index: number }) => Promise<number>,
) => {
  const bounded = Math.max(1, Math.min(limit, jobs.length))
  const results: JobResult[] = Array(jobs.length)
  let cursor = 0

  const worker = async () => {
    while (true) {
      const current = cursor++
      if (current >= jobs.length) break
      const job = jobs[current]
      if (!job) continue
      try {
        const duration = await runner(job)
        results[current] = { duration }
      } catch (error) {
        results[current] = {
          duration: 0,
          error: error instanceof Error ? error.message : "unknown",
        }
      }
    }
  }

  await Promise.all(Array.from({ length: bounded }, worker))
  return results
}

const summarizeDurations = (durations: number[]): DurationStats => {
  if (durations.length === 0) {
    return { avg: 0, p50: 0, p95: 0, p99: 0, max: 0 }
  }
  const sorted = [...durations].sort((a, b) => a - b)
  const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length
  const percentile = (p: number): number => {
    if (sorted.length === 0) return 0
    const position = Math.max(0, Math.min(sorted.length - 1, Math.round(p * (sorted.length - 1))))
    return sorted[position] ?? 0
  }
  return {
    avg,
    p50: percentile(0.5),
    p95: percentile(0.95),
    p99: percentile(0.99),
    max: sorted[sorted.length - 1] ?? 0,
  }
}

main().catch((error) => {
  console.error("macro chat-loop stress bench failed", error)
  process.exit(1)
})
