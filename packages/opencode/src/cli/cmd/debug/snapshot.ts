import { $ } from "bun"
import fs from "fs/promises"
import { EOL } from "os"
import path from "path"
import { Config } from "../../../config/config"
import { Global } from "../../../global"
import { Instance } from "../../../project/instance"
import { Snapshot } from "../../../snapshot"
import { bootstrap } from "../../bootstrap"
import { cmd } from "../cmd"

const hour = 60 * 60 * 1000

export const SnapshotCommand = cmd({
  command: "snapshot",
  describe: "snapshot debugging utilities",
  builder: (yargs) =>
    yargs.command(TrackCommand).command(PatchCommand).command(DiffCommand).command(VerifyCommand).demandCommand(),
  async handler() {},
})

const TrackCommand = cmd({
  command: "track",
  describe: "track current snapshot state",
  async handler() {
    await bootstrap(process.cwd(), async () => {
      console.log(await Snapshot.track())
    })
  },
})

const PatchCommand = cmd({
  command: "patch <hash>",
  describe: "show patch for a snapshot hash",
  builder: (yargs) =>
    yargs.positional("hash", {
      type: "string",
      description: "hash",
      demandOption: true,
    }),
  async handler(args) {
    await bootstrap(process.cwd(), async () => {
      console.log(await Snapshot.patch(args.hash))
    })
  },
})

const DiffCommand = cmd({
  command: "diff <hash>",
  describe: "show diff for a snapshot hash",
  builder: (yargs) =>
    yargs.positional("hash", {
      type: "string",
      description: "hash",
      demandOption: true,
    }),
  async handler(args) {
    await bootstrap(process.cwd(), async () => {
      console.log(await Snapshot.diff(args.hash))
    })
  },
})

const VerifyCommand = cmd({
  command: "verify",
  describe: "run contention-heavy snapshot verification and report health",
  builder: (yargs) =>
    yargs
      .option("iterations", {
        type: "number",
        default: 120,
        description: "Number of churn iterations",
      })
      .option("concurrency", {
        type: "number",
        default: 8,
        description: "Parallel operations per iteration",
      })
      .option("cleanup-every", {
        type: "number",
        default: 6,
        description: "Run cleanup every N iterations",
      }),
  async handler(args) {
    await bootstrap(process.cwd(), async () => {
      const cfg = await Config.get()
      if (cfg.snapshot === false) {
        throw new Error("snapshot verification requires snapshot=true")
      }
      const iterations = Math.max(1, Math.floor(args.iterations ?? 120))
      const concurrency = Math.max(1, Math.floor(args.concurrency ?? 8))
      const cleanupEvery = Math.max(1, Math.floor(args["cleanup-every"] ?? 6))
      const git = path.join(Global.Path.data, "snapshot", Instance.project.id)
      const probe = path.join(Instance.worktree, ".opencode-snapshot-verify.tmp")
      const existed = await fs
        .stat(probe)
        .then(() => true)
        .catch(() => false)
      const prior = existed ? await Bun.file(probe).text().catch(() => "") : ""

      const started = Date.now()
      const before = await health(git)

      let hash = (await Snapshot.track()) ?? ""
      if (!hash) {
        const seed = await Promise.all(Array.from({ length: 4 }, () => Snapshot.track()))
        const next = seed.find((item) => item)
        hash = next ?? ""
      }
      if (!hash) throw new Error("failed to acquire initial snapshot hash")

      try {
        for (const i of Array.from({ length: iterations }, (_, i) => i)) {
          await Bun.write(probe, `verify:${i}:${Date.now()}`)
          const base = hash
          const tasks = Array.from({ length: concurrency }, (_, j) => {
            if (j % 3 === 0) return Snapshot.track().then((next) => next ?? "")
            if (j % 3 === 1) return Snapshot.patch(base).then(() => "")
            return Snapshot.diff(base).then(() => "")
          })
          if (i % cleanupEvery === 0) tasks.push(Snapshot.cleanup().then(() => ""))
          for (const next of await Promise.all(tasks)) {
            if (next) hash = next
          }
        }
      } finally {
        if (existed) await Bun.write(probe, prior)
        else await fs.unlink(probe).catch(() => {})
      }

      await Snapshot.cleanup()
      const after = await health(git)
      const result = {
        project: Instance.project.id,
        git,
        options: {
          iterations,
          concurrency,
          cleanupEvery,
        },
        duration_ms: Date.now() - started,
        before,
        after,
        delta: {
          loose: after.count.loose - before.count.loose,
          packs: after.count.packs - before.count.packs,
          size_kib: after.count.size_kib - before.count.size_kib,
          size_pack_kib: after.count.size_pack_kib - before.count.size_pack_kib,
        },
        ok: !after.index_lock && after.tmp_pack.stale === 0,
      }

      process.stdout.write(JSON.stringify(result, null, 2) + EOL)
      if (!result.ok) process.exitCode = 1
    })
  },
})

async function health(git: string) {
  const count = await countObjects(git)
  const tmp = await tmpPacks(git)
  const indexLock = await fs
    .access(path.join(git, "index.lock"))
    .then(() => true)
    .catch(() => false)
  return {
    count,
    index_lock: indexLock,
    tmp_pack: {
      total: tmp.length,
      stale: tmp.filter((item) => item.age_ms > hour).length,
      files: tmp,
    },
  }
}

async function countObjects(git: string) {
  const text = await $`git --git-dir ${git} count-objects -v`.quiet().nothrow().text()
  const entries = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const i = line.indexOf(":")
      if (i < 0) return []
      return [[line.slice(0, i).trim(), line.slice(i + 1).trim()] as const]
    })
  const values = new Map(entries)
  const num = (key: string) => parseInt(values.get(key) ?? "0") || 0
  return {
    loose: num("count"),
    size_kib: num("size"),
    in_pack: num("in-pack"),
    packs: num("packs"),
    size_pack_kib: num("size-pack"),
    prune_packable: num("prune-packable"),
    garbage: num("garbage"),
    size_garbage_kib: num("size-garbage"),
  }
}

async function tmpPacks(git: string) {
  const dir = path.join(git, "objects", "pack")
  const files = await fs.readdir(dir).catch(() => [])
  const now = Date.now()
  return (
    await Promise.all(
      files
        .filter((name) => name.startsWith("tmp_pack_"))
        .map(async (name) => {
          const stat = await fs
            .stat(path.join(dir, name))
            .then((stat) => stat)
            .catch(() => undefined)
          if (!stat) return
          return {
            name,
            age_ms: Math.max(0, Math.floor(now - stat.mtimeMs)),
          }
        }),
    )
  ).filter((item): item is { name: string; age_ms: number } => Boolean(item))
}
