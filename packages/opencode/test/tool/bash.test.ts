import { describe, expect, test } from "bun:test"
import path from "path"
import { BashTool } from "../../src/tool/bash"
import { Instance } from "../../src/project/instance"

const ctx = {
  sessionID: "test",
  messageID: "",
  toolCallID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  metadata: () => {},
}

const bash = await BashTool.init()
const projectRoot = path.join(__dirname, "../..")

describe("tool.bash", () => {
  test("basic", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const result = await bash.execute(
          {
            command: "echo 'test'",
            description: "Echo test message",
          },
          ctx,
        )
        expect(result.metadata.exit).toBe(0)
        expect(result.metadata.output).toContain("test")
      },
    })
  })

  test("cd ../ should fail outside of project root", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        expect(
          bash.execute(
            {
              command: "cd ../",
              description: "Try to cd to parent directory",
            },
            ctx,
          ),
        ).rejects.toThrow("This command references paths outside of")
      },
    })
  })

  test("cwd parameter with valid directory", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const result = await bash.execute(
          {
            command: "pwd",
            cwd: projectRoot,
            description: "Get current working directory",
          },
          ctx,
        )
        expect(result.metadata.exit).toBe(0)
        expect(result.metadata.output).toContain(projectRoot)
      },
    })
  })

  test("cwd parameter outside project should fail", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        expect(
          bash.execute(
            {
              command: "pwd",
              cwd: "/tmp",
              description: "Try to use cwd outside project",
            },
            ctx,
          ),
        ).rejects.toThrow("Working directory")
      },
    })
  })

  test("cwd parameter with relative path", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const result = await bash.execute(
          {
            command: "pwd",
            cwd: path.join(projectRoot, "src"),
            description: "Use absolute path for cwd",
          },
          ctx,
        )
        expect(result.metadata.exit).toBe(0)
        expect(result.metadata.output).toContain("/src")
      },
    })
  })

  test("default behavior without cwd parameter", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const result = await bash.execute(
          {
            command: "pwd",
            description: "Get default working directory",
          },
          ctx,
        )
        expect(result.metadata.exit).toBe(0)
        expect(result.metadata.output).toContain(projectRoot)
      },
    })
  })
})
