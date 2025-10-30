import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Permission } from "../../../src/permission"
import {
  createPermissionInput,
  createPermissionInfo,
  MOCK_PLUGIN_RESPONSES,
} from "../fixtures/test-data"
import { createMockState, resetAllMocks } from "../fixtures/mock-plugins"
import { flushPromises } from "../fixtures/helpers"

// Mock all dependencies except Plugin (which we want to test integration)
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

vi.mock("../../../src/project/instance", () => ({
  Instance: {
    state: vi.fn(),
  },
}))

describe("Permission System - Plugin Integration", () => {
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

  describe("Plugin Trigger Integration", () => {
    it("should call Plugin.trigger with correct event name", async () => {
      const { mockState } = createMockState()

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = createPermissionInput({
        type: "test-tool",
        title: "Test Permission",
      })

      await Permission.ask(input)

      expect(Plugin.trigger).toHaveBeenCalledWith("permission.ask", expect.any(Object), {
        status: "ask",
      })
    })

    it("should pass complete permission info to plugin", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = createPermissionInput({
        type: "file.read",
        title: "Read File Permission",
        pattern: "file.read.*",
        sessionID: "session-123",
        messageID: "message-456",
        callID: "call-789",
        metadata: {
          filePath: "/path/to/file.txt",
          userId: "user-123",
          context: { operation: "read", sensitive: true },
        },
      })

      await Permission.ask(input)

      const permissionInfo = Plugin.trigger.mock.calls[0][1]
      expect(permissionInfo).toMatchObject({
        type: "file.read",
        title: "Read File Permission",
        pattern: "file.read.*",
        sessionID: "session-123",
        messageID: "message-456",
        callID: "call-789",
        metadata: {
          filePath: "/path/to/file.txt",
          userId: "user-123",
          context: { operation: "read", sensitive: true },
        },
      })
      expect(typeof permissionInfo.id).toBe("string")
      expect(typeof permissionInfo.time.created).toBe("number")
    })

    it("should pass correct context to plugin", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = createPermissionInput()

      await Permission.ask(input)

      expect(Plugin.trigger).toHaveBeenCalledWith("permission.ask", expect.any(Object), {
        status: "ask",
      })
    })
  })

  describe("Plugin Response Handling", () => {
    it("should handle plugin allow response", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "allow" })

      const input = createPermissionInput()

      const result = Permission.ask(input)

      // Should return immediately (not a promise)
      expect(result).toBeUndefined()

      // Should not create pending permission
      expect(mockState.pending).toEqual({})

      // Should not publish events
      const { Bus } = require("../../../src/bus")
      expect(Bus.publish).not.toHaveBeenCalled()
    })

    it("should handle plugin deny response", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "deny" })

      const input = createPermissionInput({
        callID: "test-call-123",
        metadata: { test: true },
      })

      await expect(Permission.ask(input)).rejects.toThrow(Permission.RejectedError)

      // Should not create pending permission
      expect(mockState.pending).toEqual({})

      // Should verify rejected error properties
      const { Plugin: PluginMock } = require("../../../src/plugin")
      const permissionInfo = PluginMock.trigger.mock.calls[0][1]

      try {
        await Permission.ask(input)
      } catch (error) {
        expect(error).toBeInstanceOf(Permission.RejectedError)
        expect(error.sessionID).toBe(input.sessionID)
        expect(error.permissionID).toBe(permissionInfo.id)
        expect(error.toolCallID).toBe(input.callID)
        expect(error.metadata).toEqual(input.metadata)
      }
    })

    it("should handle plugin error response", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "error", error: "Plugin error occurred" })

      const input = createPermissionInput()

      const permissionPromise = Permission.ask(input)

      // Should fall back to creating pending permission
      expect(mockState.pending[input.sessionID]).toBeDefined()

      // Clean up
      const pendingPermission = Object.values(mockState.pending[input.sessionID])[0]
      pendingPermission.resolve()
      await permissionPromise
    })

    it("should handle plugin exceptions gracefully", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockRejectedValue(new Error("Plugin crashed"))

      const input = createPermissionInput()

      const permissionPromise = Permission.ask(input)

      // Should fall back to creating pending permission
      expect(mockState.pending[input.sessionID]).toBeDefined()

      // Clean up
      const pendingPermission = Object.values(mockState.pending[input.sessionID])[0]
      pendingPermission.resolve()
      await permissionPromise
    })

    it("should handle plugin timeout", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: "allow" }), 10000)),
      )

      const input = createPermissionInput()

      const permissionPromise = Permission.ask(input)

      // Should not wait indefinitely, but create pending permission
      // Note: This depends on implementation details of timeout handling
      expect(mockState.pending[input.sessionID]).toBeDefined()

      // Clean up
      const pendingPermission = Object.values(mockState.pending[input.sessionID])[0]
      pendingPermission.resolve()
      await permissionPromise
    })
  })

  describe("Multiple Plugin Scenarios", () => {
    it("should handle multiple permission requests to same plugin", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Create multiple permission requests
      const inputs = [
        createPermissionInput({ messageID: "msg-1", type: "tool.read" }),
        createPermissionInput({ messageID: "msg-2", type: "tool.write" }),
        createPermissionInput({ messageID: "msg-3", type: "tool.execute" }),
      ]

      const promises = inputs.map((input) => Permission.ask(input))

      // Should call plugin for each request
      expect(Plugin.trigger).toHaveBeenCalledTimes(3)

      // Should create pending permissions for all
      expect(Object.keys(mockState.pending["test-session-id"])).toHaveLength(3)

      // Clean up
      const sessionPending = mockState.pending["test-session-id"]
      Object.values(sessionPending).forEach((pending) => pending.resolve())
      await Promise.all(promises)
    })

    it("should handle plugin with different response types", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger
        .mockResolvedValueOnce({ status: "allow" })
        .mockResolvedValueOnce({ status: "deny" })
        .mockResolvedValueOnce({ status: "ask" })

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Test different plugin responses
      const allowInput = createPermissionInput({ messageID: "allow-test" })
      const denyInput = createPermissionInput({ messageID: "deny-test" })
      const askInput = createPermissionInput({ messageID: "ask-test" })

      const allowResult = Permission.ask(allowInput)
      const denyPromise = Permission.ask(denyInput)
      const askPromise = Permission.ask(askInput)

      // Allow should return immediately
      expect(allowResult).toBeUndefined()

      // Deny should throw
      await expect(denyPromise).rejects.toThrow(Permission.RejectedError)

      // Ask should create pending permission
      expect(mockState.pending["test-session-id"]).toBeDefined()

      // Clean up
      const sessionPending = mockState.pending["test-session-id"]
      const pendingPermission = Object.values(sessionPending)[0]
      pendingPermission.resolve()
      await askPromise
    })
  })

  describe("Plugin State Management", () => {
    it("should maintain plugin state across permission requests", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      // Mock plugin with internal state
      let pluginCallCount = 0
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockImplementation(() => {
        pluginCallCount++
        return Promise.resolve({
          status: pluginCallCount > 2 ? "allow" : "ask",
          callCount: pluginCallCount,
        })
      })

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Make multiple requests
      const inputs = Array.from({ length: 5 }, (_, i) =>
        createPermissionInput({ messageID: `msg-${i}` }),
      )

      const promises = inputs.map((input) => Permission.ask(input))

      await flushPromises()

      // Plugin should have been called 5 times with increasing count
      expect(Plugin.trigger).toHaveBeenCalledTimes(5)

      // Check that plugin received correct state
      for (let i = 0; i < 5; i++) {
        const pluginCall = Plugin.trigger.mock.calls[i]
        expect(pluginCall[2]).toEqual({ status: "ask" })
      }

      // Clean up
      const sessionPending = mockState.pending["test-session-id"]
      Object.values(sessionPending).forEach((pending) => pending.resolve())
      await Promise.all(promises)
    })

    it("should handle plugin initialization and cleanup", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      // Mock plugin with lifecycle
      const { Plugin } = require("../../../src/plugin")
      let initialized = false
      Plugin.trigger.mockImplementation(() => {
        if (!initialized) {
          initialized = true
          // Simulate plugin initialization
        }
        return Promise.resolve({ status: "ask" })
      })

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      const input = createPermissionInput()
      const permissionPromise = Permission.ask(input)

      // Plugin should be initialized on first call
      expect(initialized).toBe(true)

      // Clean up
      const pendingPermission = Object.values(mockState.pending[input.sessionID])[0]
      pendingPermission.resolve()
      await permissionPromise
    })
  })

  describe("Plugin Error Recovery", () => {
    it("should recover from temporary plugin failures", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      let failureCount = 0
      Plugin.trigger.mockImplementation(() => {
        failureCount++
        if (failureCount <= 2) {
          return Promise.reject(new Error(`Plugin failure ${failureCount}`))
        }
        return Promise.resolve({ status: "allow" })
      })

      // Make requests that will initially fail
      const inputs = Array.from({ length: 5 }, (_, i) =>
        createPermissionInput({ messageID: `msg-${i}` }),
      )

      const promises = inputs.map((input) => Permission.ask(input))

      await flushPromises()

      // Should have attempted plugin calls for all requests
      expect(Plugin.trigger).toHaveBeenCalledTimes(5)

      // Some should have fallen back to pending permissions
      expect(Object.keys(mockState.pending["test-session-id"])).toBeGreaterThan(0)

      // Clean up
      const sessionPending = mockState.pending["test-session-id"]
      Object.values(sessionPending).forEach((pending) => pending.resolve())
      await Promise.all(promises)
    })

    it("should handle plugin returning invalid responses", async () => {
      const { mockState } = createMockState()
      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "invalid-status" })

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      const input = createPermissionInput()
      const permissionPromise = Permission.ask(input)

      // Should fall back to creating pending permission for invalid response
      expect(mockState.pending[input.sessionID]).toBeDefined()

      // Clean up
      const pendingPermission = Object.values(mockState.pending[input.sessionID])[0]
      pendingPermission.resolve()
      await permissionPromise
    })
  })
})
