import autocannon, { type Result as AutocannonResult } from "autocannon"
import { Server } from "@/server/server"
import { ensurePerfEnv, loadScenarioBody, createSession, writePerfResult } from "./utils"

const asNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const connections = asNumber(process.env.PERF_CONNECTIONS, 8)
const duration = asNumber(process.env.PERF_DURATION, 10)
const resultFile = "macro-http-message.json"

const main = async () => {
  ensurePerfEnv()
  const server = Server.listen({ port: 0, hostname: "127.0.0.1" })
  try {
    const baseURL = `http://127.0.0.1:${server.port}`
    const sessionID = await createSession(baseURL)
    const payload = await loadScenarioBody()
    const body = JSON.stringify(payload)
    const url = `${baseURL}/session/${sessionID}/message`
    const bench = await runAutocannon({ url, body })
    const metrics = pickMetrics(bench)
    await writePerfResult(resultFile, {
      suite: "macro",
      name: "http-message-send",
      metrics,
      meta: {
        node: process.version,
        bun: Bun.version,
        connections,
        duration,
        sessionID,
      },
    })
    console.table(metrics)
  } finally {
    server.stop()
  }
}

const runAutocannon = (input: { url: string; body: string }) => {
  return new Promise<AutocannonResult>((resolve, reject) => {
    autocannon(
      {
        url: input.url,
        method: "POST",
        connections,
        duration,
        headers: {
          "content-type": "application/json",
        },
        body: input.body,
      },
      (error: Error | null, result: AutocannonResult) => {
        if (error) reject(error)
        else resolve(result)
      },
    )
  })
}

const pickMetrics = (result: AutocannonResult) => {
  return {
    rpsAvg: result.requests.average,
    rpsMax: result.requests.max,
    latencyP50: result.latency.p50,
    latencyP95: result.latency.p95,
    latencyP99: result.latency.p99,
    throughputAvg: result.throughput.average,
    errors: result.errors,
    timeouts: result.timeouts,
    duration: result.duration,
  }
}

main().catch((error) => {
  console.error("macro http bench failed", error)
  process.exit(1)
})
