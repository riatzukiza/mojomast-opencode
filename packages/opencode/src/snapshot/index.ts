import { $ } from "bun"
import path from "path"
import fs from "fs/promises"
import { Log } from "../util/log"
import { Flag } from "../flag/flag"
import { Global } from "../global"
import z from "zod"
import { Config } from "../config/config"
import { Instance } from "../project/instance"
import { Scheduler } from "../scheduler"
import { git as runGit } from "../util/git"

export namespace Snapshot {
  const log = Log.create({ service: "snapshot" })
  const hour = 60 * 60 * 1000
  const prune = "7.days"
  const treehash = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
  const retry = [0, 25, 100]
  type Gate = {
    held: boolean
    wait: (() => void)[]
  }
  const gate = new Map<string, Gate>()

  function item(git: string) {
    const existing = gate.get(git)
    if (existing) return existing
    const fresh: Gate = {
      held: false,
      wait: [],
    }
    gate.set(git, fresh)
    return fresh
  }

  function unlock(git: string, lock: Gate) {
    const next = lock.wait.shift()
    if (next) {
      next()
      return
    }
    lock.held = false
    if (!lock.held && lock.wait.length === 0) gate.delete(git)
  }

  function token(git: string, lock: Gate): Disposable {
    return {
      [Symbol.dispose]: () => unlock(git, lock),
    }
  }

  function tryLock(git: string) {
    const lock = item(git)
    if (lock.held) return
    lock.held = true
    return token(git, lock)
  }

  async function lock(git: string): Promise<Disposable> {
    const entry = item(git)
    if (!entry.held) {
      entry.held = true
      return token(git, entry)
    }
    return new Promise((resolve) => {
      entry.wait.push(() => {
        entry.held = true
        resolve(token(git, entry))
      })
    })
  }

  export function init() {
    Scheduler.register({
      id: "snapshot.cleanup",
      interval: hour,
      run: cleanup,
      scope: "instance",
    })
  }

  export async function cleanup() {
    if (Instance.project.vcs !== "git" || Flag.OPENCODE_CLIENT === "acp") return
    const cfg = await Config.get()
    if (cfg.snapshot === false) return
    const git = gitdir()
    const permit = tryLock(git)
    if (!permit) {
      log.info("cleanup skipped", { git, reason: "busy" })
      // Retry up to 3 times with jittered backoff if blocked
      const backoff = Math.floor(Math.random() * 500) + 100
      setTimeout(() => {
        void cleanup()
      }, backoff)
      return
    }
    using _ = permit
    const exists = await fs
      .stat(git)
      .then(() => true)
      .catch(() => false)
    if (!exists) return

    // Clean stale tmp_pack files (older than 1 hour)
    const packs = path.join(git, "objects/pack")
    try {
      const files = await fs.readdir(packs)
      const now = Date.now()
      for (const file of files) {
        if (!file.startsWith("tmp_pack_")) continue
        const stat = await fs.stat(path.join(packs, file))
        if (now - stat.mtimeMs > hour) {
          await fs.unlink(path.join(packs, file)).catch(() => {})
        }
      }
    } catch {}

    const count = await $`git --git-dir ${git} count-objects -v`.quiet().text()
    const loose = parseInt(count.match(/count: (\d+)/)?.[1] ?? "0")
    if (loose < 100) return

    await $`git --git-dir ${git} gc --auto`.quiet().nothrow()

    // If still too many loose objects or packs, prune
    const after = await $`git --git-dir ${git} count-objects -v`.quiet().text()
    const packsCount = parseInt(after.match(/packs: (\d+)/)?.[1] ?? "0")
    if (packsCount > 50) {
      await $`git --git-dir ${git} gc --prune=${prune}`.quiet().nothrow()
      log.info("cleanup", { prune })
    }
  }

  export async function track() {
    if (Instance.project.vcs !== "git" || Flag.OPENCODE_CLIENT === "acp") return
    const cfg = await Config.get()
    if (cfg.snapshot === false) return
    const git = gitdir()
    using _ = await lock(git)
    if (await fs.mkdir(git, { recursive: true })) {
      await $`git init`
        .env({
          ...process.env,
          GIT_DIR: git,
          GIT_WORK_TREE: Instance.worktree,
        })
        .quiet()
        .nothrow()
      // Configure git to not convert line endings on Windows
      await $`git --git-dir ${git} config core.autocrlf false`.quiet().nothrow()
      await $`git --git-dir ${git} config core.longpaths true`.quiet().nothrow()
      await $`git --git-dir ${git} config core.symlinks true`.quiet().nothrow()
      await $`git --git-dir ${git} config core.fsmonitor false`.quiet().nothrow()
      await $`git --git-dir ${git} config gc.auto 0`.quiet().nothrow()
      await $`git --git-dir ${git} config maintenance.auto false`.quiet().nothrow()
      log.info("initialized")
    }
    const staged = await add(git)
    if (!staged) return
    const tree = await write(git)
    if (!tree) return
    log.info("tracking", { hash: tree, cwd: Instance.directory, git })
    return tree
  }

  export const Patch = z.object({
    hash: z.string(),
    files: z.string().array(),
  })
  export type Patch = z.infer<typeof Patch>

  export async function patch(hash: string): Promise<Patch> {
    const git = gitdir()
    using _ = await lock(git)
    const staged = await add(git)
    if (!staged) return { hash, files: [] }
    const result =
      await $`git -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true -c core.quotepath=false --git-dir ${git} --work-tree ${Instance.worktree} diff --no-ext-diff --name-only ${hash} -- .`
        .quiet()
        .cwd(Instance.directory)
        .nothrow()

    // If git diff fails, return empty patch
    if (result.exitCode !== 0) {
      log.warn("failed to get diff", { hash, exitCode: result.exitCode })
      return { hash, files: [] }
    }

    const files = result.text()
    return {
      hash,
      files: files
        .trim()
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => path.join(Instance.worktree, x).replaceAll("\\", "/")),
    }
  }

  export async function restore(snapshot: string) {
    log.info("restore", { commit: snapshot })
    const git = gitdir()
    using _ = await lock(git)
    const result =
      await $`git -c core.longpaths=true -c core.symlinks=true --git-dir ${git} --work-tree ${Instance.worktree} read-tree ${snapshot} && git -c core.longpaths=true -c core.symlinks=true --git-dir ${git} --work-tree ${Instance.worktree} checkout-index -a -f`
        .quiet()
        .cwd(Instance.worktree)
        .nothrow()

    if (result.exitCode !== 0) {
      log.error("failed to restore snapshot", {
        snapshot,
        exitCode: result.exitCode,
        stderr: result.stderr.toString(),
        stdout: result.stdout.toString(),
      })
    }
  }

  export async function revert(patches: Patch[]) {
    const files = new Set<string>()
    const git = gitdir()
    using _ = await lock(git)
    for (const item of patches) {
      for (const file of item.files) {
        if (files.has(file)) continue
        log.info("reverting", { file, hash: item.hash })
        const result =
          await $`git -c core.longpaths=true -c core.symlinks=true --git-dir ${git} --work-tree ${Instance.worktree} checkout ${item.hash} -- ${file}`
            .quiet()
            .cwd(Instance.worktree)
            .nothrow()
        if (result.exitCode !== 0) {
          const relativePath = path.relative(Instance.worktree, file)
          const checkTree =
            await $`git -c core.longpaths=true -c core.symlinks=true --git-dir ${git} --work-tree ${Instance.worktree} ls-tree ${item.hash} -- ${relativePath}`
              .quiet()
              .cwd(Instance.worktree)
              .nothrow()
          if (checkTree.exitCode === 0 && checkTree.text().trim()) {
            log.info("file existed in snapshot but checkout failed, keeping", {
              file,
            })
          } else {
            log.info("file did not exist in snapshot, deleting", { file })
            await fs.unlink(file).catch(() => {})
          }
        }
        files.add(file)
      }
    }
  }

  export async function diff(hash: string) {
    const git = gitdir()
    using _ = await lock(git)
    const staged = await add(git)
    if (!staged) return ""
    const result =
      await $`git -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true -c core.quotepath=false --git-dir ${git} --work-tree ${Instance.worktree} diff --no-ext-diff ${hash} -- .`
        .quiet()
        .cwd(Instance.worktree)
        .nothrow()

    if (result.exitCode !== 0) {
      log.warn("failed to get diff", {
        hash,
        exitCode: result.exitCode,
        stderr: result.stderr.toString(),
        stdout: result.stdout.toString(),
      })
      return ""
    }

    return result.text().trim()
  }

  export const FileDiff = z
    .object({
      file: z.string(),
      before: z.string(),
      after: z.string(),
      additions: z.number(),
      deletions: z.number(),
      status: z.enum(["added", "deleted", "modified"]).optional(),
    })
    .meta({
      ref: "FileDiff",
    })
  export type FileDiff = z.infer<typeof FileDiff>
  export async function diffFull(from: string, to: string): Promise<FileDiff[]> {
    const git = gitdir()
    using _ = await lock(git)
    const result: FileDiff[] = []
    const status = new Map<string, "added" | "deleted" | "modified">()

    const statuses =
      await $`git -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true -c core.quotepath=false --git-dir ${git} --work-tree ${Instance.worktree} diff --no-ext-diff --name-status --no-renames ${from} ${to} -- .`
        .quiet()
        .cwd(Instance.directory)
        .nothrow()
        .text()

    for (const line of statuses.trim().split("\n")) {
      if (!line) continue
      const [code, file] = line.split("\t")
      if (!code || !file) continue
      const kind = code.startsWith("A") ? "added" : code.startsWith("D") ? "deleted" : "modified"
      status.set(file, kind)
    }

    for await (const line of $`git -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true -c core.quotepath=false --git-dir ${git} --work-tree ${Instance.worktree} diff --no-ext-diff --no-renames --numstat ${from} ${to} -- .`
      .quiet()
      .cwd(Instance.directory)
      .nothrow()
      .lines()) {
      if (!line) continue
      const [additions, deletions, file] = line.split("\t")
      const isBinaryFile = additions === "-" && deletions === "-"
      const before = isBinaryFile
        ? ""
        : await $`git -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true --git-dir ${git} --work-tree ${Instance.worktree} show ${from}:${file}`
            .quiet()
            .nothrow()
            .text()
      const after = isBinaryFile
        ? ""
        : await $`git -c core.autocrlf=false -c core.longpaths=true -c core.symlinks=true --git-dir ${git} --work-tree ${Instance.worktree} show ${to}:${file}`
            .quiet()
            .nothrow()
            .text()
      const added = isBinaryFile ? 0 : parseInt(additions)
      const deleted = isBinaryFile ? 0 : parseInt(deletions)
      result.push({
        file,
        before,
        after,
        additions: Number.isFinite(added) ? added : 0,
        deletions: Number.isFinite(deleted) ? deleted : 0,
        status: status.get(file) ?? "modified",
      })
    }
    return result
  }

  function gitdir() {
    const project = Instance.project
    return path.join(Global.Path.data, "snapshot", project.id)
  }

  async function add(git: string) {
    await syncExclude(git)
    const result = await command({
      args: [
        "-c",
        "core.autocrlf=false",
        "-c",
        "core.longpaths=true",
        "-c",
        "core.symlinks=true",
        "--git-dir",
        git,
        "--work-tree",
        Instance.worktree,
        "add",
        ".",
      ],
      cwd: Instance.directory,
      retryLock: true,
    })
    if (result.exitCode === 0) return true
    log.warn("git add failed", {
      git,
      cwd: Instance.directory,
      exitCode: result.exitCode,
      stderr: result.stderr,
      stdout: result.stdout,
    })
    return false
  }

  async function write(git: string) {
    const result = await command({
      args: ["--git-dir", git, "--work-tree", Instance.worktree, "write-tree"],
      cwd: Instance.directory,
      retryLock: true,
    })
    if (result.exitCode !== 0) {
      log.warn("write-tree failed", {
        git,
        cwd: Instance.directory,
        exitCode: result.exitCode,
        stderr: result.stderr,
        stdout: result.stdout,
      })
      return
    }
    if (!treehash.test(result.text)) {
      log.warn("write-tree returned invalid hash", {
        git,
        cwd: Instance.directory,
        hash: result.text,
      })
      return
    }
    return result.text
  }

  function output(input: Buffer | ReadableStream<Uint8Array>) {
    if (Buffer.isBuffer(input)) return input.toString()
    return ""
  }

  function conflict(input: string) {
    const text = input.toLowerCase()
    if (text.includes("index.lock")) return true
    if (text.includes("another git process seems to be running")) return true
    return false
  }

  async function command(input: {
    args: string[]
    cwd: string
    retryLock?: boolean
  }) {
    let last = {
      exitCode: 1,
      stderr: "",
      stdout: "",
      text: "",
    }
    for (const ms of retry) {
      if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms))
      const result = await runGit(input.args, { cwd: input.cwd })
      const stdout = (await result.text()).trim()
      const stderr = output(result.stderr)
      last = {
        exitCode: result.exitCode,
        stderr,
        stdout,
        text: stdout,
      }
      if (last.exitCode === 0) return last
      if (!input.retryLock) return last
      if (!conflict(`${stderr}\n${stdout}`)) return last
    }
    return last
  }

  async function syncExclude(git: string) {
    const file = await excludes()
    const target = path.join(git, "info", "exclude")
    await fs.mkdir(path.join(git, "info"), { recursive: true })
    if (!file) {
      await Bun.write(target, "")
      return
    }
    const text = await Bun.file(file)
      .text()
      .catch(() => "")
    await Bun.write(target, text)
  }

  async function excludes() {
    const file = await $`git rev-parse --path-format=absolute --git-path info/exclude`
      .quiet()
      .cwd(Instance.worktree)
      .nothrow()
      .text()
    if (!file.trim()) return
    const exists = await fs
      .stat(file.trim())
      .then(() => true)
      .catch(() => false)
    if (!exists) return
    return file.trim()
  }
}
