import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Permission } from "../../../src/permission"
import { createPermissionInfo, createPermissionInput } from "../fixtures/test-data"
import { createMockState, resetAllMocks } from "../fixtures/mock-plugins"
import { flushPromises, expectRejectedError } from "../fixtures/helpers"

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

describe("Permission.respond function", () => {
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

  describe("Basic Response Handling", () => {
    it("should handle 'once' response correctly", async () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({ id: "perm-1", sessionID: "session-1" })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Respond with 'once'
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "once",
      })

      // Should resolve the promise
      expect(resolve).toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // Should remove from pending
      expect(mockState.pending["session-1"]["perm-1"]).toBeUndefined()

      // Should publish reply event
      expect(Bus.publish).toHaveBeenCalledWith(
        expect.any(Object), // Event.Replied
        {
          sessionID: "session-1",
          permissionID: "perm-1",
          response: "once",
        },
      )

      // Should not add to approved
      expect(mockState.approved["session-1"]).toBeUndefined()
    })

    it("should handle 'always' response correctly", async () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
        pattern: "tool.read",
      })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Respond with 'always'
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      // Should resolve the promise
      expect(resolve).toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()

      // Should remove from pending
      expect(mockState.pending["session-1"]["perm-1"]).toBeUndefined()

      // Should publish reply event
      expect(Bus.publish).toHaveBeenCalledWith(expect.any(Object), {
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      // Should add to approved
      expect(mockState.approved["session-1"]).toEqual({
        "tool.read": true,
      })
    })

    it("should handle 'reject' response correctly", async () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        callID: "call-123",
        metadata: { test: true },
      })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      // Respond with 'reject'
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "reject",
      })

      // Should reject the promise
      expect(reject).toHaveBeenCalledWith(expect.any(Permission.RejectedError))
      expect(resolve).not.toHaveBeenCalled()

      // Should remove from pending
      expect(mockState.pending["session-1"]["perm-1"]).toBeUndefined()

      // Should publish reply event
      const { Bus } = require("../../../src/bus")
      expect(Bus.publish).toHaveBeenCalledWith(expect.any(Object), {
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "reject",
      })

      // Should not add to approved
      expect(mockState.approved["session-1"]).toBeUndefined()

      // Verify rejected error
      const rejectedError = reject.mock.calls[0][0]
      expectRejectedError(rejectedError, "session-1", "perm-1")
      expect(rejectedError.toolCallID).toBe("call-123")
      expect(rejectedError.metadata).toEqual({ test: true })
    })
  })

  describe("Invalid Response Handling", () => {
    it("should handle non-existent permission ID gracefully", () => {
      const { mockState } = createMockState()
      mockState.pending = {
        "session-1": {
          "perm-1": { info: createPermissionInfo(), resolve: vi.fn(), reject: vi.fn() },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Try to respond to non-existent permission
      Permission.respond({
        sessionID: "session-1",
        permissionID: "non-existent",
        response: "once",
      })

      // Should not throw
      expect(Bus.publish).not.toHaveBeenCalled()
      expect(mockState.pending["session-1"]["perm-1"]).toBeDefined() // Original permission still there
    })

    it("should handle non-existent session ID gracefully", () => {
      const { mockState } = createMockState()
      mockState.pending = {
        "session-1": {
          "perm-1": { info: createPermissionInfo(), resolve: vi.fn(), reject: vi.fn() },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Try to respond to non-existent session
      Permission.respond({
        sessionID: "non-existent-session",
        permissionID: "perm-1",
        response: "once",
      })

      // Should not throw
      expect(Bus.publish).not.toHaveBeenCalled()
      expect(mockState.pending["session-1"]["perm-1"]).toBeDefined() // Original permission still there
    })

    it("should handle empty pending permissions gracefully", () => {
      const { mockState } = createMockState()
      mockState.pending = {}

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Try to respond when no pending permissions
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "once",
      })

      // Should not throw
      expect(Bus.publish).not.toHaveBeenCalled()
    })
  })

  describe("Always Approval Logic", () => {
    it("should create approval keys for string pattern", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read.file",
        pattern: "tool.read.file",
      })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      expect(mockState.approved["session-1"]).toEqual({
        "tool.read.file": true,
      })
    })

    it("should create approval keys for array pattern", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
        pattern: ["tool.read", "tool.write"],
      })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      expect(mockState.approved["session-1"]).toEqual({
        "tool.read": true,
        "tool.write": true,
      })
    })

    it("should create approval key for undefined pattern", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
        pattern: undefined,
      })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      expect(mockState.approved["session-1"]).toEqual({
        "tool.read": true,
      })
    })
  })

  describe("Cascade Approval for Matching Requests", () => {
    it("should auto-approve matching pending permissions", () => {
      const { mockState } = createMockState()

      // Create multiple pending permissions
      const permission1 = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
        pattern: "tool.read",
      })
      const permission2 = createPermissionInfo({
        id: "perm-2",
        sessionID: "session-1",
        type: "tool.read.file",
        pattern: "tool.read.file",
      })
      const permission3 = createPermissionInfo({
        id: "perm-3",
        sessionID: "session-1",
        type: "tool.write",
        pattern: "tool.write",
      })

      const resolve1 = vi.fn()
      const resolve2 = vi.fn()
      const resolve3 = vi.fn()
      const reject1 = vi.fn()
      const reject2 = vi.fn()
      const reject3 = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permission1, resolve: resolve1, reject: reject1 },
          "perm-2": { info: permission2, resolve: resolve2, reject: reject2 },
          "perm-3": { info: permission3, resolve: resolve3, reject: reject3 },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Mock wildcard matching - perm-2 should match with perm-1's approval
      const mockWildcardMatch = vi.fn()
      mockWildcardMatch.mockImplementation((str, pattern) => {
        if (str === "tool.read.file" && pattern === "tool.read") return true
        if (str === "tool.write" && pattern === "tool.read") return false
        return false
      })

      // Mock the Wildcard.match function
      const { Wildcard } = require("../../../src/util/wildcard")
      Wildcard.match = mockWildcardMatch

      // Respond with 'always' to perm-1 (tool.read)
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      // perm-1 should be resolved
      expect(resolve1).toHaveBeenCalled()
      expect(reject1).not.toHaveBeenCalled()

      // perm-2 should be auto-approved and resolved (matches tool.read pattern)
      expect(resolve2).toHaveBeenCalled()
      expect(reject2).not.toHaveBeenCalled()

      // perm-3 should not be resolved (doesn't match tool.read pattern)
      expect(resolve3).not.toHaveBeenCalled()
      expect(reject3).not.toHaveBeenCalled()

      // Check final state
      expect(mockState.pending["session-1"]["perm-1"]).toBeUndefined()
      expect(mockState.pending["session-1"]["perm-2"]).toBeUndefined()
      expect(mockState.pending["session-1"]["perm-3"]).toBeDefined() // Still pending

      // Should have published events for resolved permissions
      expect(Bus.publish).toHaveBeenCalledTimes(2) // perm-1 response + perm-2 cascade
    })

    it("should handle cascade approval with array patterns", () => {
      const { mockState } = createMockState()

      const permission1 = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
        pattern: ["tool.read", "tool.write"],
      })
      const permission2 = createPermissionInfo({
        id: "perm-2",
        sessionID: "session-1",
        type: "tool.write",
        pattern: "tool.write",
      })

      const resolve1 = vi.fn()
      const resolve2 = vi.fn()
      const reject1 = vi.fn()
      const reject2 = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permission1, resolve: resolve1, reject: reject1 },
          "perm-2": { info: permission2, resolve: resolve2, reject: reject2 },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Mock wildcard matching
      const mockWildcardMatch = vi.fn()
      mockWildcardMatch.mockReturnValue(true) // Everything matches

      vi.doMock("../../../src/util/wildcard", () => ({
        Wildcard: {
          match: mockWildcardMatch,
        },
      }))

      // Respond with 'always' to perm-1
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      // Both should be resolved
      expect(resolve1).toHaveBeenCalled()
      expect(resolve2).toHaveBeenCalled()

      // Should have both approvals
      expect(mockState.approved["session-1"]).toEqual({
        "tool.read": true,
        "tool.write": true,
      })
    })

    it("should not cascade when no matching pending permissions", () => {
      const { mockState } = createMockState()

      const permission1 = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
        pattern: "tool.read",
      })
      const permission2 = createPermissionInfo({
        id: "perm-2",
        sessionID: "session-1",
        type: "tool.write",
        pattern: "tool.write",
      })

      const resolve1 = vi.fn()
      const resolve2 = vi.fn()
      const reject1 = vi.fn()
      const reject2 = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permission1, resolve: resolve1, reject: reject1 },
          "perm-2": { info: permission2, resolve: resolve2, reject: reject2 },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Mock wildcard matching - nothing matches
      const mockWildcardMatch = vi.fn()
      mockWildcardMatch.mockReturnValue(false)

      // Mock the Wildcard.match function
      const { Wildcard } = require("../../../src/util/wildcard")
      Wildcard.match = mockWildcardMatch

      // Respond with 'always' to perm-1
      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      // Only perm-1 should be resolved
      expect(resolve1).toHaveBeenCalled()
      expect(resolve2).not.toHaveBeenCalled()

      // perm-2 should still be pending
      expect(mockState.pending["session-1"]["perm-2"]).toBeDefined()
    })
  })

  describe("Event Publishing", () => {
    it("should publish Event.Replied with correct data", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({ id: "perm-1", sessionID: "session-1" })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      const mockEvent = { type: "test-event" }
      Bus.event.mockReturnValue(mockEvent)
      Bus.publish.mockReturnValue(undefined)

      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "once",
      })

      expect(Bus.event).toHaveBeenCalledWith(
        "permission.replied",
        expect.objectContaining({
          sessionID: expect.any(String),
          permissionID: expect.any(String),
          response: expect.any(String),
        }),
      )
      expect(Bus.publish).toHaveBeenCalledWith(mockEvent, {
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "once",
      })
    })

    it("should publish multiple events for cascade approvals", () => {
      const { mockState } = createMockState()

      const permission1 = createPermissionInfo({
        id: "perm-1",
        sessionID: "session-1",
        type: "tool.read",
      })
      const permission2 = createPermissionInfo({
        id: "perm-2",
        sessionID: "session-1",
        type: "tool.read",
      })

      const resolve1 = vi.fn()
      const resolve2 = vi.fn()
      const reject1 = vi.fn()
      const reject2 = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permission1, resolve: resolve1, reject: reject1 },
          "perm-2": { info: permission2, resolve: resolve2, reject: reject2 },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Mock wildcard matching to enable cascade
      const mockWildcardMatch = vi.fn(() => true)
      vi.doMock("../../../src/util/wildcard", () => ({
        Wildcard: {
          match: mockWildcardMatch,
        },
      }))

      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })

      // Should publish events for both permissions
      expect(Bus.publish).toHaveBeenCalledTimes(2)
      expect(Bus.publish).toHaveBeenCalledWith(expect.any(Object), {
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "always",
      })
      expect(Bus.publish).toHaveBeenCalledWith(expect.any(Object), {
        sessionID: "session-1",
        permissionID: "perm-2",
        response: "always",
      })
    })
  })

  describe("Logging", () => {
    it("should log response with correct parameters", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({ id: "perm-1", sessionID: "session-1" })
      const resolve = vi.fn()
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Log } = require("../../../src/util/log")
      const mockLogInstance = { info: vi.fn(), error: vi.fn() }
      Log.create.mockReturnValue(mockLogInstance)

      Permission.respond({
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "once",
      })

      expect(mockLogInstance.info).toHaveBeenCalledWith("response", {
        sessionID: "session-1",
        permissionID: "perm-1",
        response: "once",
      })
    })

    it("should not log for non-existent permission", () => {
      const { mockState } = createMockState()
      mockState.pending = {}

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      Permission.respond({
        sessionID: "session-1",
        permissionID: "non-existent",
        response: "once",
      })

      // Log.create is already mocked in global setup
      const { Log } = require("../../../src/util/log")
      expect(Log.create).toHaveBeenCalled()
    })
  })

  describe("Error Handling", () => {
    it("should handle resolve function errors gracefully", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({ id: "perm-1", sessionID: "session-1" })
      const resolve = vi.fn(() => {
        throw new Error("Resolve failed")
      })
      const reject = vi.fn()

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Should not throw even if resolve fails
      expect(() => {
        Permission.respond({
          sessionID: "session-1",
          permissionID: "perm-1",
          response: "once",
        })
      }).not.toThrow()

      // Should still remove from pending and publish event
      expect(mockState.pending["session-1"]["perm-1"]).toBeUndefined()
      expect(Bus.publish).toHaveBeenCalled()
    })

    it("should handle reject function errors gracefully", () => {
      const { mockState } = createMockState()
      const permissionInfo = createPermissionInfo({ id: "perm-1", sessionID: "session-1" })
      const resolve = vi.fn()
      const reject = vi.fn(() => {
        throw new Error("Reject failed")
      })

      mockState.pending = {
        "session-1": {
          "perm-1": { info: permissionInfo, resolve, reject },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const { Bus } = require("../../../src/bus")
      Bus.publish.mockReturnValue(undefined)

      // Should not throw even if reject fails
      expect(() => {
        Permission.respond({
          sessionID: "session-1",
          permissionID: "perm-1",
          response: "reject",
        })
      }).not.toThrow()

      // Should still remove from pending and publish event
      expect(mockState.pending["session-1"]["perm-1"]).toBeUndefined()
      expect(Bus.publish).toHaveBeenCalled()
    })
  })
})
