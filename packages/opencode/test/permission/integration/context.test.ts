import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Permission } from "../../../src/permission"
import { createMockState, resetAllMocks } from "../fixtures/mock-plugins"

// Mock all dependencies
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

vi.mock("../../../src/project/instance", () => ({
  Instance: {
    state: vi.fn(),
  },
}))

describe("Permission with Context Integration Tests", () => {
  beforeEach(() => {
    resetAllMocks()

    // Set up default mock state
    const { mockState } = createMockState()
    const { Instance } = require("../../../src/project/instance")
    Instance.state.mockReturnValue(mockState)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Permission.ask with proper context", () => {
    it("should handle permission request with context", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Should not throw when called with proper context
      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)

      // Plugin.trigger should be called
      expect(Plugin.trigger).toHaveBeenCalled()
    })

    it("should handle plugin deny response", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "deny" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
          }

          await expect(Permission.ask(input)).rejects.toThrow(Permission.RejectedError)
    })

    it("should handle plugin allow response", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "allow" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      const result = await Permission.ask(input)
      expect(result).toBeUndefined()
    })

    it("should handle plugin allow response", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "allow" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      const result = await Permission.ask(input)
      expect(result).toBeUndefined()
    })
  })

  describe("Permission.respond with proper context", () => {
    it("should handle respond with context", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Create a pending permission
      const promise = Permission.ask(input)

      // Respond to permission
      const respondInput = {
        sessionID: "test-session",
        permissionID: "any-id", // This won't find permission but should not throw
        response: "once" as const,
      }

      // Should not throw
      expect(() => Permission.respond(respondInput)).not.toThrow()
    })
  })

  describe("Internal utility functions", () => {
    it("should test toKeys function through permission system", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "allow" })

      // Test undefined pattern
      const input1 = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }
      await Permission.ask(input1)

      // Test string pattern
      const input2 = {
        type: "test-tool",
        title: "Test Permission",
        pattern: "tool.read",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }
      await Permission.ask(input2)

      // Test array pattern
      const input3 = {
        type: "test-tool",
        title: "Test Permission",
        pattern: ["tool.read", "tool.write"],
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }
      await Permission.ask(input3)

      // All should complete without errors
      expect(Plugin.trigger).toHaveBeenCalledTimes(3)
    })
  })
    })
  })

  describe("Permission.respond with proper context", () => {
    it("should handle respond with context", async () => {
      pluginSpy.mockResolvedValue({ status: "ask" })

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

          // Create a pending permission
          const promise = Permission.ask(input)

          // Respond to the permission
          const respondInput = {
            sessionID: "test-session",
            permissionID: "any-id", // This won't find the permission but should not throw
            response: "once" as const,
          }

          // Should not throw
          expect(() => Permission.respond(respondInput)).not.toThrow()
        },
      })
    })
  })

  describe("Internal utility functions", () => {
    it("should test toKeys function through permission system", async () => {
      pluginSpy.mockResolvedValue({ status: "allow" })

      await Instance.provide({
        directory: projectDir,
        fn: async () => {
          // Test undefined pattern
          const input1 = {
            type: "test-tool",
            title: "Test Permission",
            sessionID: "test-session",
            messageID: "test-message",
            metadata: {},
          }
          await Permission.ask(input1)

          // Test string pattern
          const input2 = {
            type: "test-tool",
            title: "Test Permission",
            pattern: "tool.read",
            sessionID: "test-session",
            messageID: "test-message",
            metadata: {},
          }
          await Permission.ask(input2)

          // Test array pattern
          const input3 = {
            type: "test-tool",
            title: "Test Permission",
            pattern: ["tool.read", "tool.write"],
            sessionID: "test-session",
            messageID: "test-message",
            metadata: {},
          }
          await Permission.ask(input3)

          // All should complete without errors
          expect(pluginSpy).toHaveBeenCalledTimes(3)
        },
      })
    })
  })
})
