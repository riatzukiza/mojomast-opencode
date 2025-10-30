import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { tmpdir } from "os"
import { join } from "path"
import { mkdirSync, writeFileSync } from "fs"

// Mock all dependencies before importing Permission
vi.mock("../../../src/bus", () => ({
  Bus: {
    event: vi.fn(),
    publish: vi.fn(),
  },
}))

vi.mock("../../../src/util/log", () => ({
  Log: {
    create: () => ({
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

vi.mock("../../../src/id/id", () => ({
  Identifier: {
    ascending: vi.fn((prefix) => `${prefix}-${Date.now()}`),
  },
}))

vi.mock("../../../src/plugin", () => ({
  Plugin: {
    trigger: vi.fn(),
  },
}))

vi.mock("../../../src/util/wildcard", () => ({
  Wildcard: {
    match: vi.fn(),
  },
}))

import { Permission } from "../../src/permission"
import { Instance } from "../../src/project/instance"

describe("Permission Basic Tests", () => {
  let tempDir: string
  let projectDir: string

  beforeEach(async () => {
    vi.clearAllMocks()

    // Create a temporary project directory
    tempDir = tmpdir()
    projectDir = join(tempDir, `test-project-${Date.now()}`)
    mkdirSync(projectDir, { recursive: true })

    // Create a minimal project structure
    writeFileSync(
      join(projectDir, "opencode.json"),
      JSON.stringify({
        $schema: "https://opencode.ai/config.json",
      }),
    )
  })

  it("should have basic exports", async () => {
    await Instance.provide({
      directory: projectDir,
      fn: () => {
        expect(typeof Permission.ask).toBe("function")
        expect(typeof Permission.respond).toBe("function")
        expect(Permission.Info).toBeDefined()
        expect(Permission.Response).toBeDefined()
        expect(Permission.RejectedError).toBeDefined()
      },
    })
  })

  it("should create permission info correctly", async () => {
    await Instance.provide({
      directory: projectDir,
      fn: () => {
        const info = {
          id: "test-id",
          type: "test-tool",
          sessionID: "test-session",
          messageID: "test-message",
          title: "Test Permission",
          metadata: {},
          time: { created: Date.now() },
        }

        expect(() => Permission.Info.parse(info)).not.toThrow()
      },
    })
  })

  it("should handle plugin allow response", async () => {
    const { Plugin } = require("../../../src/plugin")
    Plugin.trigger.mockResolvedValue({ status: "allow" })

    await Instance.provide({
      directory: projectDir,
      fn: async () => {
        const input = {
          type: "test-tool",
          title: "Test Permission",
          sessionID: "test-session",
          messageID: "test-message",
          metadata: {},
        }

        const result = await Permission.ask(input)
        expect(result).toBeUndefined()
      },
    })
  })

  it("should handle plugin deny response", async () => {
    const { Plugin } = require("../../../src/plugin")
    Plugin.trigger.mockResolvedValue({ status: "deny" })

    await Instance.provide({
      directory: projectDir,
      fn: async () => {
        const input = {
          type: "test-tool",
          title: "Test Permission",
          sessionID: "test-session",
          messageID: "test-message",
          metadata: {},
        }

        await expect(Permission.ask(input)).rejects.toThrow(Permission.RejectedError)
      },
    })
  })

  it("should create pending permission for ask response", async () => {
    const { Plugin } = require("../../../src/plugin")
    Plugin.trigger.mockResolvedValue({ status: "ask" })

    await Instance.provide({
      directory: projectDir,
      fn: async () => {
        const input = {
          type: "test-tool",
          title: "Test Permission",
          sessionID: "test-session",
          messageID: "test-message",
          metadata: {},
        }

        const promise = Permission.ask(input)
        expect(promise).toBeInstanceOf(Promise)

        // Clean up by resolving the promise
        const respondInput = {
          sessionID: "test-session",
          permissionID: "any-id",
          response: "once" as const,
        }

        // This should not throw even if permission doesn't exist
        expect(() => Permission.respond(respondInput)).not.toThrow()

        await promise.catch(() => {}) // Ignore any rejections
      },
    })
  })

  it("should handle respond function", async () => {
    const { Bus } = require("../../../src/bus")
    Bus.publish.mockReturnValue(undefined)

    await Instance.provide({
      directory: projectDir,
      fn: () => {
        const respondInput = {
          sessionID: "test-session",
          permissionID: "test-permission-id",
          response: "once" as const,
        }

        expect(() => Permission.respond(respondInput)).not.toThrow()
      },
    })
  })
})
