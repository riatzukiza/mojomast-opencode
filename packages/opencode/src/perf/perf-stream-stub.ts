import { Identifier } from "@/id/id"
import { MessageV2 } from "@/session/message-v2"
import { Session } from "@/session"
import { SessionSummary } from "@/session/summary"

const FLAG = "OPENCODE_PERF_PROVIDER"
const FLAG_VALUE = "stub"

const TEXT_ENV = "OPENCODE_PERF_STUB_TEXT"
const CHUNKS_ENV = "OPENCODE_PERF_STUB_CHUNKS"
const DELAY_ENV = "OPENCODE_PERF_STUB_DELAY_MS"

const DEFAULT_TEXT = "perf stub chunk"
const DEFAULT_CHUNKS = 6
const DEFAULT_DELAY_MS = 5

type ProcessorHandle = {
  next(parentID: string): Promise<MessageV2.Assistant>
}

type ProcessResult = {
  info: MessageV2.Assistant
  parts: MessageV2.Part[]
  blocked: boolean
  shouldRetry: boolean
}

const numberFromEnv = (name: string, fallback: number) => {
  const value = process.env[name]
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const chunkText = (value: string, index: number) => {
  const base = value.trim().length ? value.trim() : DEFAULT_TEXT
  return `${base} · ${index + 1}`.trim()
}

const deriveSource = (text: string) => {
  if (text.trim().length) return text.trim()
  const fallback = process.env[TEXT_ENV]
  return fallback?.trim().length ? fallback : DEFAULT_TEXT
}

const chunkDelay = () => numberFromEnv(DELAY_ENV, DEFAULT_DELAY_MS)

const chunkCount = () => numberFromEnv(CHUNKS_ENV, DEFAULT_CHUNKS)

export namespace PerfStreamStub {
  export const isEnabled = () => process.env[FLAG]?.toLowerCase() === FLAG_VALUE

  export const run = async (input: {
    processor: ProcessorHandle
    parentID: string
    sessionID: string
    text: string
  }): Promise<ProcessResult> => {
    const assistant = await input.processor.next(input.parentID)
    const source = deriveSource(input.text)
    const pieces = Array.from({ length: chunkCount() }, (_, index) => chunkText(source, index))
    const start = Date.now()
    const textPart: MessageV2.TextPart = {
      id: Identifier.ascending("part"),
      messageID: assistant.id,
      sessionID: assistant.sessionID,
      type: "text",
      text: "",
      time: {
        start,
      },
    }
    const delayMs = chunkDelay()
    for (const piece of pieces) {
      textPart.text += piece
      await Session.updatePart({
        part: textPart,
        delta: piece,
      })
      if (delayMs > 0) {
        await Bun.sleep(delayMs)
      }
    }
    textPart.text = textPart.text.trimEnd()
    textPart.time = {
      start,
      end: Date.now(),
    }
    await Session.updatePart(textPart)

    const totalChars = pieces.reduce((sum, piece) => sum + piece.length, 0)
    const outputTokens = Math.max(1, Math.round(totalChars / 4))
    assistant.tokens.output = outputTokens
    assistant.time.completed = Date.now()
    await Session.updateMessage(assistant)
    SessionSummary.summarize({
      sessionID: assistant.sessionID,
      messageID: assistant.parentID,
    })
    const parts = await MessageV2.parts(assistant.id)
    return {
      info: assistant,
      parts,
      blocked: false,
      shouldRetry: false,
    }
  }
}
