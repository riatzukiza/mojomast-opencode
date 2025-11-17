import path from "path"
import { mkdir, readFile, writeFile } from "fs/promises"

export type PerfResult = {
  suite: string
  name: string
  metrics: Record<string, number>
  meta: Record<string, string | number>
}

const DEFAULT_BODY = {
  agent: "build",
  system: "Benchmark perf stub",
  parts: [
    {
      type: "text",
      text: "Measure opencode streaming performance",
    },
  ],
}

const cloneDefaultBody = () => JSON.parse(JSON.stringify(DEFAULT_BODY)) as typeof DEFAULT_BODY

const scenarioFile = path.join(process.cwd(), "perf/tools/autocannon/chat-loop.json")
const perfOut = () => process.env.PERF_OUT ?? path.join("perf", "regression")

export const ensurePerfEnv = () => {
  process.env.NODE_ENV ??= "production"
  process.env.OPENCODE_PERF_PROVIDER ??= "stub"
}

export const loadScenarioBody = async () => {
  return readFile(scenarioFile, "utf8")
    .then((text) => JSON.parse(text) as Partial<typeof DEFAULT_BODY>)
    .then((body) => ({ ...cloneDefaultBody(), ...body }))
    .catch(() => cloneDefaultBody())
}

export const createSession = async (baseURL: string) => {
  const res = await fetch(`${baseURL}/session`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{}",
  })
  if (!res.ok) {
    throw new Error(`failed to create session: ${res.status}`)
  }
  const json = (await res.json()) as { id: string }
  return json.id
}

export const writePerfResult = async (filename: string, data: PerfResult) => {
  const outDir = perfOut()
  const filePath = path.join(process.cwd(), outDir, filename)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(data, null, 2))
}
