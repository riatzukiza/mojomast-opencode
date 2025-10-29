import { describe, expect, test } from "bun:test"
import path from "path"
import { BashTool } from "../../src/tool/bash"
import { Instance } from "../../src/project/instance"

const ctx = {
  sessionID: "test",
  messageID: "",
  callID: "",
  agent: "build",
  abort: new AbortController().signal,
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

  test("should handle non-existent commands", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const result = await bash.execute(
          {
            command: "nonexistent-command-12345",
            description: "Test non-existent command",
          },
          ctx,
        )

        expect(result.metadata.exit).toBeGreaterThan(0)
        expect(result.metadata.output).toContain("not found")
      },
    })
  })

  test("should handle command timeout", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const result = await bash.execute(
          {
            command: "sleep 10",
            description: "Test command timeout",
            timeout: 100, // 100ms timeout
          },
          ctx,
        )

        expect(result.metadata.exit).toBeGreaterThan(0)
        expect(result.metadata.output).toContain("timeout")
      },
    })
  })

  test("should handle invalid command parameters", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        await expect(
          bash.execute(
            {
              command: "",
              description: "Empty command",
            },
            ctx,
          ),
        ).rejects.toThrow()
      },
    })
  })

  test("should handle dangerous commands", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        await expect(
          bash.execute(
            {
              command: "rm -rf /",
              description: "Dangerous command",
            },
            ctx,
          ),
        ).rejects.toThrow("dangerous")
      },
    })
  })
})
