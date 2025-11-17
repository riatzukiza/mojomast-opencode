import fs from "fs"
import os from "os"
import path from "path"
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises"
import { Bench } from "tinybench"
import { ensurePerfEnv, writePerfResult } from "../macro/utils"

const numberEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

const ENTRY_COUNT = numberEnv(process.env.PERF_FS_ENTRIES, 2000)
const FILE_SIZE = numberEnv(process.env.PERF_FS_FILESIZE, 32 * 1024)
const BENCH_TIME = numberEnv(process.env.PERF_TIME_MS, 1000)
const RESULT_FILE = "micro-message-preprocess.json"
const DEFAULT_TARGET = "/home/err/devel"
const TARGET_PATH = process.env.PERF_FS_TARGET ?? DEFAULT_TARGET
const FORCE_FIXTURE = (process.env.PERF_FS_MODE ?? "").toLowerCase() === "fixture"
const MAX_SCAN_DEPTH = numberEnv(process.env.PERF_FS_MAX_DEPTH, 4)
const MAX_SCAN_ENTRIES = numberEnv(process.env.PERF_FS_SCAN_LIMIT, 5000)
const SKIP_DIRS = (process.env.PERF_FS_SKIP ?? "node_modules,.git,.sst,.next,dist,build")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".txt",
  ".yml",
  ".yaml",
  ".sh",
  ".bash",
  ".css",
  ".scss",
])

type Fixture = {
  root: string
  directory: string
  attachment: string
  missingName: string
  mode: "synthetic" | "real"
  cleanup?: () => Promise<void>
}

type BenchTask = InstanceType<typeof Bench>["tasks"][number]

const main = async () => {
  ensurePerfEnv()
  const fixture = await createFixture()
  try {
    const bench = new Bench({ time: BENCH_TIME, iterations: 0 })
    bench.add("missing-file-scan", () => {
      missingFileSuggestions(fixture.directory, fixture.missingName)
    })
    bench.add("directory-listing", () => {
      listDirectory(fixture.directory)
    })
    bench.add("large-file-read-text", async () => {
      await readLargeFileText(fixture.attachment)
    })
    bench.add("large-file-read-bytes", async () => {
      await readLargeFileBytes(fixture.attachment)
    })

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

    const meta: Record<string, string | number> = {
      node: process.version,
      bun: Bun.version,
      durationMs: BENCH_TIME,
      mode: fixture.mode,
    }
    if (fixture.mode === "synthetic") {
      meta["entries"] = ENTRY_COUNT
      meta["fileSize"] = FILE_SIZE
    } else {
      meta["target"] = fixture.root
      meta["directory"] = fixture.directory
      meta["attachment"] = fixture.attachment
    }

    await writePerfResult(RESULT_FILE, {
      suite: "micro",
      name: "message-preprocess",
      metrics,
      meta,
    })
  } finally {
    await cleanupFixture(fixture)
  }
}

const createFixture = async (): Promise<Fixture> => {
  const preferReal = !FORCE_FIXTURE && pathExists(TARGET_PATH)
  if (preferReal) {
    const realFixture = await createExistingFixture(TARGET_PATH)
    if (realFixture) return realFixture
  }
  return createSyntheticFixture()
}

const pathExists = (target: string | undefined) => {
  if (!target) return false
  try {
    return fs.existsSync(target)
  } catch {
    return false
  }
}

const createExistingFixture = async (target: string): Promise<Fixture | null> => {
  const directory = process.env.PERF_FS_DIRECTORY ?? target
  if (!pathExists(directory)) return null

  const attachmentOverride = process.env.PERF_FS_FILE
  let attachment = attachmentOverride && path.isAbsolute(attachmentOverride) ? attachmentOverride : undefined
  if (!attachment && attachmentOverride) {
    attachment = path.join(directory, attachmentOverride)
  }
  if (attachment && !pathExists(attachment)) {
    attachment = undefined
  }
  if (!attachment) {
    attachment = findAttachmentFile(directory)
  }
  if (!attachment) return null

  const missingName = deriveMissingName(path.basename(attachment))

  return {
    root: target,
    directory,
    attachment,
    missingName,
    mode: "real",
  }
}

const deriveMissingName = (existing: string) => {
  if (!existing) return "__opencode_missing__"
  const dot = existing.lastIndexOf(".")
  if (dot > 0) {
    return `${existing.slice(0, dot)}-missing${existing.slice(dot)}`
  }
  return `${existing}-missing`
}

const findAttachmentFile = (start: string): string | undefined => {
  const queue: { dir: string; depth: number }[] = [{ dir: start, depth: 0 }]
  const visited = new Set<string>()
  let scanned = 0

  while (queue.length && scanned < MAX_SCAN_ENTRIES) {
    const current = queue.shift()!
    const real = safeRealpath(current.dir)
    if (real) {
      if (visited.has(real)) continue
      visited.add(real)
    }

    let entries: fs.Dirent[] = []
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true })
    } catch {
      continue
    }
    scanned += entries.length

    for (const entry of entries) {
      if (shouldSkip(entry.name)) continue
      const fullPath = path.join(current.dir, entry.name)

      if (entry.isFile()) {
        if (isReadableFile(fullPath)) return fullPath
        continue
      }

      if (entry.isSymbolicLink()) {
        const stats = safeStat(fullPath)
        if (!stats) continue
        if (stats.isFile()) {
          if (isReadableFile(fullPath)) return fullPath
          continue
        }
        if (stats.isDirectory() && current.depth < MAX_SCAN_DEPTH) {
          queue.push({ dir: fullPath, depth: current.depth + 1 })
        }
        continue
      }

      if (entry.isDirectory() && current.depth < MAX_SCAN_DEPTH) {
        queue.push({ dir: fullPath, depth: current.depth + 1 })
      }
    }
  }
  return undefined
}

const isReadableFile = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase()
  if (TEXT_EXTENSIONS.has(ext)) return true
  const stats = safeStat(filePath)
  if (!stats) return false
  return stats.size > 0 && stats.size <= FILE_SIZE * 32
}

const safeStat = (filePath: string) => {
  try {
    return fs.statSync(filePath)
  } catch {
    return null
  }
}

const safeRealpath = (target: string) => {
  try {
    return fs.realpathSync(target)
  } catch {
    return undefined
  }
}

const shouldSkip = (name: string) => SKIP_DIRS.some((skip) => skip.length > 0 && name === skip)

const createSyntheticFixture = async (): Promise<Fixture> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode-perf-fs-"))
  const directory = path.join(root, "repo", "packages", "app", "src")
  await mkdir(directory, { recursive: true })

  const buffer = Buffer.alloc(FILE_SIZE, "A")
  const writes: Promise<void>[] = []
  for (let i = 0; i < ENTRY_COUNT; i++) {
    const filePath = path.join(directory, `file-${i.toString().padStart(6, "0")}.ts`)
    writes.push(writeFile(filePath, buffer))
    if (writes.length >= 32) {
      await Promise.all(writes)
      writes.length = 0
    }
  }
  if (writes.length) {
    await Promise.all(writes)
  }

  const attachment = path.join(directory, "attachment.txt")
  await writeFile(attachment, Buffer.alloc(FILE_SIZE, "L"))

  const suffix = Math.max(ENTRY_COUNT - 1, 0)
    .toString()
    .padStart(6, "0")
  const existingName = `file-${suffix}.ts`
  const missingName = existingName.slice(0, -1)

  return {
    root,
    directory,
    attachment,
    missingName,
    mode: "synthetic",
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

const cleanupFixture = async (fixture: Fixture) => {
  await fixture.cleanup?.()
}

const missingFileSuggestions = (directory: string, missingName: string) => {
  const base = missingName.toLowerCase()
  const entries = fs.readdirSync(directory)
  const suggestions = entries
    .filter((entry) => {
      const name = entry.toLowerCase()
      return name.includes(base) || base.includes(name)
    })
    .slice(0, 3)
  if (suggestions.length) {
    return suggestions
  }
  return entries.slice(0, Math.min(3, entries.length))
}

const listDirectory = (directory: string) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  let count = 0
  for (const entry of entries) {
    if (entry.isDirectory() || entry.isFile()) count++
  }
  return count
}

const readLargeFileText = async (filePath: string) => {
  const text = await Bun.file(filePath).text()
  if (!text.length) {
    throw new Error("failed to read text payload")
  }
  return text.length
}

const readLargeFileBytes = async (filePath: string) => {
  const bytes = await Bun.file(filePath).bytes()
  if (bytes.length === 0) {
    throw new Error("failed to read bytes payload")
  }
  const encoded = Buffer.from(bytes).toString("base64")
  if (!encoded.length) {
    throw new Error("failed to encode payload")
  }
  return encoded.length
}

main().catch((error) => {
  console.error("micro message-preprocess bench failed", error)
  process.exit(1)
})
