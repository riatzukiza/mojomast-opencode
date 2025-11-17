import path from "path"
import nodePath from "path"
import { Bench } from "tinybench"
import { MessageV2 } from "@/session/message-v2"
import { ensurePerfEnv, writePerfResult } from "../macro/utils"

const numberEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const BENCH_TIME = numberEnv(process.env.PERF_TIME_MS, 1000)
const RESULT_FILE = "micro-message-serialization.json"

type Scenario = {
  name: string
  history: MessageV2.WithParts[]
  summary: string
}

type BenchTask = InstanceType<typeof Bench>["tasks"][number]

const main = async () => {
  ensurePerfEnv()
  const scenarios = buildScenarios()
  const bench = new Bench({ time: BENCH_TIME, iterations: 0 })

  for (const scenario of scenarios) {
    bench.add(scenario.name, () => {
      MessageV2.toModelMessage(scenario.history)
    })
  }

  await bench.run()

  const rows = bench.tasks.map((task: BenchTask) => ({
    name: task.name,
    hz: Number(task.result?.hz?.toFixed(2) ?? 0),
    avgMs: Number(((task.result?.mean ?? 0) * 1000).toFixed(3)),
    samples: task.result?.samples?.length ?? 0,
  }))
  console.table(rows)

  const metrics: Record<string, number> = {}
  for (const task of bench.tasks as BenchTask[]) {
    const base = task.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()
    metrics[`${base}_hz`] = task.result?.hz ?? 0
    metrics[`${base}_avg_ms`] = (task.result?.mean ?? 0) * 1000
  }

  const scenarioSummary = scenarios.map((scenario) => ({
    name: scenario.name,
    messages: scenario.history.length,
    summary: scenario.summary,
  }))

  await writePerfResult(RESULT_FILE, {
    suite: "micro",
    name: "message-serialization",
    metrics,
    meta: {
      node: process.version,
      bun: Bun.version,
      durationMs: BENCH_TIME,
      scenarios: JSON.stringify(scenarioSummary),
    },
  })
}

const buildScenarios = (): Scenario[] => {
  return [
    {
      name: "short",
      history: buildHistory({ turns: 8, textLength: 64, reasoningEvery: 0, filesEvery: 4 }),
      summary: "8 messages, short user prompts",
    },
    {
      name: "medium",
      history: buildHistory({ turns: 40, textLength: 256, reasoningEvery: 4, filesEvery: 5 }),
      summary: "40 messages, mid text, occasional reasoning",
    },
    {
      name: "long_files",
      history: buildHistory({ turns: 120, textLength: 512, reasoningEvery: 3, filesEvery: 2 }),
      summary: "120 messages, long text with frequent file parts",
    },
  ]
}

type HistoryOptions = {
  turns: number
  textLength: number
  reasoningEvery: number
  filesEvery: number
}

const buildHistory = (options: HistoryOptions) => {
  const result: MessageV2.WithParts[] = []
  const sessionID = "session-perf"
  let clock = 1_700_000_000_000

  for (let turn = 0; turn < options.turns; turn++) {
    const userID = `usr-${turn}`
    const userText = generateText(`Describe change ${turn}: `, options.textLength)
    const user: MessageV2.User = {
      id: userID,
      role: "user",
      sessionID,
      time: { created: clock++ },
      agent: "build",
      model: {
        providerID: "perf-provider",
        modelID: "perf-small",
      },
    }
    const userParts: MessageV2.Part[] = [createTextPart(userID, sessionID, userText)]

    if (options.filesEvery > 0 && turn % options.filesEvery === 0) {
      userParts.push(createFilePart(userID, sessionID, `/repo/file-${turn}.ts`, options.textLength))
    }

    result.push({ info: user, parts: userParts })

    const assistantID = `ast-${turn}`
    const assistantText = generateText(`Plan for change ${turn}: `, options.textLength)
    const assistant: MessageV2.Assistant = {
      id: assistantID,
      sessionID,
      role: "assistant",
      parentID: userID,
      time: {
        created: clock++,
        completed: clock++,
      },
      cost: 0,
      tokens: {
        input: options.textLength,
        output: options.textLength,
        reasoning: 0,
        cache: { read: 0, write: 0 },
      },
      modelID: "perf-large",
      providerID: "perf-provider",
      mode: "build",
      path: {
        cwd: "/repo",
        root: "/repo",
      },
    }

    const assistantParts: MessageV2.Part[] = [createTextPart(assistantID, sessionID, assistantText)]

    if (options.reasoningEvery > 0 && turn % options.reasoningEvery === 0) {
      assistantParts.push(createReasoningPart(assistantID, sessionID, options.textLength))
    }

    result.push({ info: assistant, parts: assistantParts })
  }

  return result
}

const createTextPart = (messageID: string, sessionID: string, text: string): MessageV2.TextPart => {
  return {
    id: `${messageID}-text-${Math.random().toString(36).slice(2)}`,
    messageID,
    sessionID,
    type: "text",
    text,
    time: {
      start: Date.now(),
      end: Date.now(),
    },
  }
}

const createReasoningPart = (messageID: string, sessionID: string, textLength: number): MessageV2.ReasoningPart => {
  return {
    id: `${messageID}-reason-${Math.random().toString(36).slice(2)}`,
    messageID,
    sessionID,
    type: "reasoning",
    text: generateText("Thinking: ", Math.max(32, textLength / 4)),
    time: {
      start: Date.now(),
      end: Date.now(),
    },
  }
}

const createFilePart = (
  messageID: string,
  sessionID: string,
  filepath: string,
  textLength: number,
): MessageV2.FilePart => {
  return {
    id: `${messageID}-file-${Math.random().toString(36).slice(2)}`,
    messageID,
    sessionID,
    type: "file",
    filename: nodePath.basename(filepath),
    mime: "text/plain",
    url: `file://${filepath}`,
    source: {
      type: "file",
      path: filepath,
      text: {
        value: generateText("file body\n", textLength / 8),
        start: 0,
        end: textLength / 8,
      },
    },
  }
}

const generateText = (prefix: string, targetLength: number) => {
  const filler = "abcdefghijklmnopqrstuvwxyz0123456789 "
  const repeatCount = Math.max(1, Math.ceil((targetLength - prefix.length) / filler.length))
  return (prefix + filler.repeat(repeatCount)).slice(0, targetLength)
}

main().catch((error) => {
  console.error("micro message-serialization bench failed", error)
  process.exit(1)
})
