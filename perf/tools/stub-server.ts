import { mkdir, rm, writeFile } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

const DEFAULT_PORT = Number(process.env.PERF_STUB_PORT ?? 8787)
const DEFAULT_HOST = process.env.PERF_STUB_HOST ?? "127.0.0.1"
const DEFAULT_DELAY_MS = Number(process.env.PERF_STUB_DELAY_MS ?? 12)
const DEFAULT_TEXT =
  process.env.PERF_STUB_TEXT ?? "Awaiting capture script. Consider running --script perf/tools/scripts/zai-plan.json"
const DEFAULT_RELATIVE_WRITE_DIR = process.env.PERF_STUB_WRITE_DIR ?? path.posix.join("perf", ".stub-tmp")
const DEFAULT_SCRIPT = process.env.PERF_STUB_SCRIPT ?? path.join("perf", "tools", "scripts", "zai-plan.json")

type Mode = "stub" | "capture" | "replay"
type ScriptEntryResponse =
  | { type: "text"; text: string; label?: string }
  | { type: "events"; events: string[]; label?: string }

type ScriptEntry = {
  request?: {
    body: any
  }
  response: ScriptEntryResponse
}

type Script = {
  entries: ScriptEntry[]
}

type ParsedArgs = Record<string, string>

const args = parseArgs(process.argv.slice(2))

const capturePath = args.capture ?? process.env.PERF_CAPTURE_FILE
const scriptPathArg =
  args.script ?? process.env.PERF_STUB_SCRIPT ?? ((await fileExists(DEFAULT_SCRIPT)) ? DEFAULT_SCRIPT : undefined)
const mode: Mode = ((): Mode => {
  if (args.mode === "stub" || args.mode === "capture" || args.mode === "replay") return args.mode
  if (args.capture || capturePath) return "capture"
  if (args.script || scriptPathArg) return "replay"
  return "stub"
})()

const config = {
  host: args.host ?? DEFAULT_HOST,
  port: numberArg(args.port) ?? DEFAULT_PORT,
  chunkDelay: numberArg(args.delay) ?? DEFAULT_DELAY_MS,
  text: args.text ?? DEFAULT_TEXT,
  writeDir: args["write-dir"] ?? DEFAULT_RELATIVE_WRITE_DIR,
  capturePath,
  scriptPath: scriptPathArg ? path.resolve(scriptPathArg) : undefined,
  upstreamBase: args["upstream-base"] ?? process.env.PERF_CAPTURE_BASE ?? "https://api.openai.com",
  upstreamKey: args["upstream-key"] ?? process.env.PERF_CAPTURE_API_KEY,
  mode,
}

const absoluteWriteDir = path.isAbsolute(config.writeDir) ? config.writeDir : path.join(process.cwd(), config.writeDir)

if (config.mode !== "capture") {
  await rm(absoluteWriteDir, { recursive: true, force: true }).catch(() => {})
}
await mkdir(absoluteWriteDir, { recursive: true })

let scriptData: Script = { entries: [] }
let replayIndex = 0

if (config.scriptPath) {
  scriptData = await loadScript(config.scriptPath)
}

console.log(`[perf-stub] mode=${config.mode} host=${config.host} port=${config.port}`)
if (config.mode === "capture" && !config.upstreamKey) {
  console.warn("[perf-stub] WARNING: capture mode selected but no upstream API key detected")
}
if (config.scriptPath) {
  console.log(`[perf-stub] script=${config.scriptPath}`)
}
console.log(`[perf-stub] writeDir=${absoluteWriteDir}`)

const server = Bun.serve({
  hostname: config.host,
  port: config.port,
  fetch: (req) => {
    const url = new URL(req.url)
    if (url.pathname === "/health") {
      return Response.json({ ok: true, mode: config.mode })
    }
    if (req.method === "POST" && url.pathname === "/v1/chat/completions") {
      if (config.mode === "capture") return handleCapture(req)
      if (config.mode === "replay") return handleReplay(req)
      return handleStub(req)
    }
    return new Response("Not Found", { status: 404 })
  },
})

async function handleStub(req: Request) {
  const body = (await req.json().catch(() => undefined)) as any
  if (!body) return invalidRequest()
  const stream = Boolean(body.stream)
  if (!stream) {
    return Response.json(buildToolCallPayload(body))
  }
  const events = buildStubEvents(body)
  return respondWithEvents(events)
}

async function handleReplay(req: Request) {
  const body = (await req.json().catch(() => undefined)) as any
  if (!body) return invalidRequest()
  if (!body.stream) {
    return Response.json({ error: "scripted responses require stream=true" }, { status: 400 })
  }
  const entry = scriptData.entries[replayIndex]
  replayIndex += 1
  if (!entry) {
    return Response.json({ error: "no scripted response available" }, { status: 410 })
  }
  let events: string[]
  if (entry.response.type === "text") {
    events = buildEventsFromText(entry.response.text, body.model ?? "perf-stub/stub-chat")
  } else {
    events = entry.response.events.slice()
  }
  events = sanitizeEvents(events)
  return respondWithEvents(events)
}

async function handleCapture(req: Request) {
  const body = (await req.json().catch(() => undefined)) as any
  if (!body) return invalidRequest()
  if (!config.upstreamKey) {
    return Response.json({ error: "capture mode requires PERF_CAPTURE_API_KEY or --upstream-key" }, { status: 400 })
  }
  const upstreamURL = new URL("/v1/chat/completions", config.upstreamBase).toString()
  const upstreamRes = await fetch(upstreamURL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.upstreamKey}`,
    },
    body: JSON.stringify(body),
  })
  const contentType = upstreamRes.headers.get("content-type") ?? ""
  if (contentType.includes("text/event-stream")) {
    const captureEvents: string[] = []
    const { readable, writable } = new TransformStream<Uint8Array>()
    const writer = writable.getWriter()
    const reader = upstreamRes.body?.getReader()
    const decoder = new TextDecoder()
    ;(async () => {
      if (!reader) {
        await writer.close()
        return
      }
      let buffer = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          await writer.write(value)
          buffer += decoder.decode(value, { stream: true })
          let index: number
          while ((index = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, index)
            buffer = buffer.slice(index + 2)
            if (chunk.trim()) captureEvents.push(chunk.trim())
          }
        }
      }
      const tail = decoder.decode()
      if (tail.trim()) captureEvents.push(tail.trim())
      await writer.close()
      await storeCaptureEntry(body, { type: "events", events: sanitizeEvents(captureEvents) })
    })()
    return new Response(readable, {
      status: upstreamRes.status,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    })
  }
  const text = await upstreamRes.text()
  await storeCaptureEntry(body, { type: "text", text })
  return new Response(text, {
    status: upstreamRes.status,
    headers: {
      "content-type": contentType || "application/json",
    },
  })
}

function invalidRequest() {
  return Response.json({ error: "invalid request payload" }, { status: 400 })
}

function buildStubEvents(body: any) {
  const base = chunkBase(body)
  const events: string[] = []
  const chunks = splitText(config.text)
  let roleSent = false
  for (const chunk of chunks) {
    const payload = chunkWith(base, {
      delta: {
        ...(roleSent ? {} : { role: "assistant" }),
        content: [
          {
            type: "text",
            text: chunk,
          },
        ],
      },
    })
    roleSent = true
    events.push(`data: ${JSON.stringify(payload)}`)
  }
  const toolPayload = chunkWith(base, {
    delta: {
      tool_calls: [buildToolCall(buildToolCallArguments(body))],
    },
  })
  events.push(`data: ${JSON.stringify(toolPayload)}`)
  events.push(`data: ${JSON.stringify(chunkWith(base, { delta: {}, finish_reason: "tool_calls" }))}`)
  events.push("data: [DONE]")
  return events
}

function buildEventsFromText(text: string, model: string) {
  const base = {
    id: randomChunkId(),
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
  }
  const events: string[] = []
  const chunks = splitText(text)
  let roleSent = false
  for (const chunk of chunks) {
    const payload = chunkWith(base, {
      delta: {
        ...(roleSent ? {} : { role: "assistant" }),
        content: [
          {
            type: "text",
            text: chunk,
          },
        ],
      },
    })
    roleSent = true
    events.push(`data: ${JSON.stringify(payload)}`)
  }
  events.push(`data: ${JSON.stringify(chunkWith(base, { delta: {}, finish_reason: "stop" }))}`)
  events.push("data: [DONE]")
  return events
}

function respondWithEvents(events: string[]) {
  const encoder = new TextEncoder()
  let index = 0
  const stream = new ReadableStream({
    async pull(controller) {
      if (index >= events.length) {
        controller.close()
        return
      }
      const event = events[index++] ?? "data: [DONE]"
      controller.enqueue(encoder.encode(`${event}\n\n`))
      if (config.chunkDelay > 0) {
        await Bun.sleep(config.chunkDelay)
      }
    },
  })
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  })
}

function buildToolCallPayload(body: any) {
  return {
    id: randomChunkId(),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: body.model ?? "perf-stub/stub-chat",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: `${config.text} (non-stream)`,
            },
          ],
          tool_calls: [buildToolCall(buildToolCallArguments(body))],
        },
        finish_reason: "tool_calls",
      },
    ],
  }
}

function chunkBase(body: any) {
  return {
    id: randomChunkId(),
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: body.model ?? "perf-stub/stub-chat",
  }
}

function chunkWith(base: any, choice: Record<string, any>) {
  return {
    ...base,
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: null,
        ...choice,
      },
    ],
  }
}

function buildToolCall(args: { path: string; content: string }) {
  return {
    id: `tool_${randomUUID().slice(0, 8)}`,
    type: "function",
    function: {
      name: "write_file",
      arguments: JSON.stringify(args),
    },
  }
}

function buildToolCallArguments(body: any) {
  const suffix = body.metadata?.requestId ?? randomUUID().slice(0, 6)
  const filename = `plan-${suffix}.md`
  const relPath = path.posix.join(config.writeDir.replace(/\\/g, "/"), filename)
  return {
    path: relPath,
    content: `# Stub Output\nGenerated by perf stub at ${new Date().toISOString()}\n`,
  }
}

function splitText(text: string) {
  return text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
}

function randomChunkId() {
  return `stub-${randomUUID().slice(0, 8)}`
}

function sanitizeEvents(events: string[]) {
  return events.map((event) => sanitizeEvent(event))
}

function sanitizeEvent(event: string) {
  const trimmed = event.trim()
  if (!trimmed.startsWith("data:")) return event
  const payloadText = trimmed.slice(5).trim()
  if (!payloadText || payloadText === "[DONE]") return trimmed
  try {
    const payload = JSON.parse(payloadText)
    for (const choice of payload.choices ?? []) {
      const toolCalls = choice.delta?.tool_calls ?? []
      for (const call of toolCalls) {
        if (call.function?.name !== "write_file" || typeof call.function.arguments !== "string") continue
        const args = parseArguments(call.function.arguments)
        const updatedPath = sanitizePath(args.path)
        call.function.arguments = JSON.stringify({ ...args, path: updatedPath })
      }
    }
    return `data: ${JSON.stringify(payload)}`
  } catch {
    return event
  }
}

function parseArguments(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

function sanitizePath(original?: string) {
  const base = original ? path.basename(original) : `stub-${randomUUID().slice(0, 6)}.md`
  const safe = base.replace(/[^a-zA-Z0-9_.-]/g, "-")
  return path.posix.join(config.writeDir.replace(/\\/g, "/"), safe)
}

async function storeCaptureEntry(requestBody: any, response: ScriptEntryResponse) {
  if (!config.capturePath) return
  scriptData.entries.push({ request: { body: requestBody }, response })
  await saveScript()
}

async function loadScript(filePath: string): Promise<Script> {
  const result = await Bun.file(filePath)
    .json()
    .catch(() => undefined)
  if (result && Array.isArray(result.entries)) {
    return result as Script
  }
  return { entries: [] }
}

async function saveScript() {
  if (!config.capturePath && !config.scriptPath) return
  const target = config.capturePath ? path.resolve(config.capturePath) : config.scriptPath!
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, JSON.stringify(scriptData, null, 2), "utf8")
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {}
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue
    const [rawKey, rawValue] = arg.slice(2).split("=")
    parsed[rawKey] = rawValue ?? "true"
  }
  return parsed
}

function numberArg(value?: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

async function fileExists(filePath?: string) {
  if (!filePath) return false
  return Bun.file(filePath).exists()
}

if (import.meta.main) {
  const shutdown = async () => {
    console.log("[perf-stub] shutting down")
    server.stop()
    if (config.mode !== "capture") {
      await rm(absoluteWriteDir, { recursive: true, force: true }).catch(() => {})
    }
    process.exit(0)
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}
