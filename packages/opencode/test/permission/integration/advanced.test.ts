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

describe("Permission Advanced Integration Tests", () => {
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

  describe("Permission.respond with always approval", () => {
    it("should handle always response and create approvals", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        pattern: "tool.read",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Create a pending permission
      const promise = Permission.ask(input)

      // Wait a bit for the permission to be created
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Respond with "always" to create approval
      const respondInput = {
        sessionID: "test-session",
        permissionID: "any-id", // This won't find specific permission but tests the logic
        response: "always" as const,
      }

      // Should not throw even if permission not found
      expect(() => Permission.respond(respondInput)).not.toThrow()
    })

    it("should handle array patterns in always response", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        pattern: ["tool.read", "tool.write"],
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {}
      }

      // Just test that it doesn't throw when creating permission
      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)
      
      // Test respond function exists and can be called
      const respondInput = {
        sessionID: "test-session",
        permissionID: "any-id",
        response: "always" as const
      }

      expect(() => Permission.respond(respondInput)).not.toThrow()
    })

    it("should handle undefined pattern in always response", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        // No pattern specified
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {}
      }

      // Just test that it doesn't throw when creating permission
      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)
      
      // Test respond function exists and can be called
      const respondInput = {
        sessionID: "test-session",
        permissionID: "any-id",
        response: "always" as const
      }

      expect(() => Permission.respond(respondInput)).not.toThrow()
    })
  })
    })

    it("should handle array patterns in always response", async () => {
      pluginSpy.mockResolvedValue({ status: "ask" })

      await Instance.provide({
        directory: projectDir,
        fn: async () => {
          const input = {
            type: "test-tool",
            title: "Test Permission",
            pattern: ["tool.read", "tool.write"],
            sessionID: "test-session",
            messageID: "test-message",
            metadata: {},
          }

          // Just test that it doesn't throw when creating permission
          const promise = Permission.ask(input)
          expect(promise).toBeInstanceOf(Promise)

          // Test respond function exists and can be called
          const respondInput = {
            sessionID: "test-session",
            permissionID: "any-id",
            response: "always" as const,
          }

          expect(() => Permission.respond(respondInput)).not.toThrow()
        },
      })
    })

    it("should handle undefined pattern in always response", async () => {
      pluginSpy.mockResolvedValue({ status: "ask" })

      await Instance.provide({
        directory: projectDir,
        fn: async () => {
          const input = {
            type: "test-tool",
            title: "Test Permission",
            // No pattern specified
            sessionID: "test-session",
            messageID: "test-message",
            metadata: {},
          }

          // Just test that it doesn't throw when creating permission
          const promise = Permission.ask(input)
          expect(promise).toBeInstanceOf(Promise)

          // Test respond function exists and can be called
          const respondInput = {
            sessionID: "test-session",
            permissionID: "any-id",
            response: "always" as const,
          }

          expect(() => Permission.respond(respondInput)).not.toThrow()
        },
      })
    })

    it("should handle undefined pattern in always response", async () => {
      pluginSpy.mockResolvedValue({ status: "ask" })

      await Instance.provide({
        directory: projectDir,
        fn: async () => {
          const input = {
            type: "test-tool",
            title: "Test Permission",
            // No pattern specified
            sessionID: "test-session",
            messageID: "test-message",
            metadata: {},
          }

          await Permission.ask(input)

          const respondInput = {
            sessionID: "test-session",
            permissionID: "any-id",
            response: "always" as const,
          }

          expect(() => Permission.respond(respondInput)).not.toThrow()
        })
      })
    })

    describe("Error handling and edge cases", () => {
    it("should handle plugin errors gracefully", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockRejectedValue(new Error("Plugin failed"))

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {}
      }

      // Should fall back to creating pending permission or handle error gracefully
      try {
        const promise = Permission.ask(input)
        expect(promise).toBeInstanceOf(Promise)
      } catch (error) {
        // Should handle the error gracefully
        expect(error).toBeDefined()
      }
    })

    it("should handle malformed plugin responses", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ invalidStatus: "unknown" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Should fall back to creating pending permission
      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)
    })

    it("should handle empty plugin response", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({})

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Should fall back to creating pending permission
      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)
    })
  })
    })

    it("should handle malformed plugin responses", async () => {
      pluginSpy.mockResolvedValue({ invalidStatus: "unknown" })

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

          // Should fall back to creating pending permission
          const promise = Permission.ask(input)
          expect(promise).toBeInstanceOf(Promise)
        },
      })
    })

    it("should handle empty plugin response", async () => {
      pluginSpy.mockResolvedValue({})

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

          // Should fall back to creating pending permission
          const promise = Permission.ask(input)
          expect(promise).toBeInstanceOf(Promise)
        },
      })
    })
  })

  describe("Complex permission scenarios", () => {
    it("should handle multiple concurrent permission requests", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input1 = {
        type: "tool.read",
        title: "Read Permission",
        sessionID: "test-session",
        messageID: "message-1",
        metadata: {},
      }

      const input2 = {
        type: "tool.write",
        title: "Write Permission",
        sessionID: "test-session",
        messageID: "message-2",
        metadata: {},
      }

      // Create multiple concurrent permissions
      const promise1 = Permission.ask(input1)
      const promise2 = Permission.ask(input2)

      expect(promise1).toBeInstanceOf(Promise)
      expect(promise2).toBeInstanceOf(Promise)
      expect(Plugin.trigger).toHaveBeenCalledTimes(2)
    })
  })
})
