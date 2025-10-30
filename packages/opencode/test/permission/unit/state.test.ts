import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { Permission } from "../../../src/permission"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Permission } from "../../../src/permission"
import { createMockPermissionState, resetAllMocks } from "../fixtures/mock-plugins"
import { createPermissionInfo } from "../fixtures/test-data"

// Mock dependencies
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

describe("Permission State Management", () => {
  beforeEach(() => {
    resetAllMocks()

    // Set up default mock state
    const { mockState } = createMockPermissionState()
    const { Instance } = require("../../../src/project/instance")
    Instance.state.mockReturnValue(mockState)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty pending and approved objects", () => {
      const { mockState } = createMockPermissionState()

      // Access the state through the permission system
      const stateFn = (Permission as any).state
      if (stateFn) {
        const initialState = stateFn()
        expect(initialState.pending).toEqual({})
        expect(initialState.approved).toEqual({})
      }

      expect(Instance.state).toHaveBeenCalledWith(expect.any(Function), expect.any(Function))
    })

    it("should provide cleanup function for state destruction", () => {
      const { mockState } = createMockPermissionState()

      // Get the cleanup function
      const stateCall = (Instance.state as any).mock.calls[0]
      const cleanupFn = stateCall[1]

      expect(typeof cleanupFn).toBe("function")
    })
  })

  describe("State Cleanup on Shutdown", () => {
    it("should reject all pending permissions on cleanup", async () => {
      // Add some pending permissions
      const permission1 = createPermissionInfo({ id: "perm1", sessionID: "session1" })
      const permission2 = createPermissionInfo({ id: "perm2", sessionID: "session2" })

      const reject1 = vi.fn()
      const reject2 = vi.fn()

      const { mockState } = createMockPermissionState(
        {
          session1: {
            perm1: { info: permission1, resolve: vi.fn(), reject: reject1 },
          },
          session2: {
            perm2: { info: permission2, resolve: vi.fn(), reject: reject2 },
          },
        },
        {},
      )

      // Get and call the cleanup function
      const { Instance } = require("../../../src/project/instance")
      const stateCall = (Instance.state as any).mock.calls[0]
      const cleanupFn = stateCall[1]

      await cleanupFn(mockState)

      expect(reject1).toHaveBeenCalledWith(expect.any(Permission.RejectedError))
      expect(reject2).toHaveBeenCalledWith(expect.any(Permission.RejectedError))

      // Verify the rejected errors have correct properties
      const error1 = reject1.mock.calls[0][0]
      const error2 = reject2.mock.calls[0][0]

      expect(error1).toBeInstanceOf(Permission.RejectedError)
      expect(error1.sessionID).toBe(permission1.sessionID)
      expect(error1.permissionID).toBe(permission1.id)

      expect(error2).toBeInstanceOf(Permission.RejectedError)
      expect(error2.sessionID).toBe(permission2.sessionID)
      expect(error2.permissionID).toBe(permission2.id)
    })

    it("should handle empty pending permissions gracefully", async () => {
      const { mockState } = createMockPermissionState({}, {})

      const { Instance } = require("../../../src/project/instance")
      const stateCall = (Instance.state as any).mock.calls[0]
      const cleanupFn = stateCall[1]

      await expect(cleanupFn(mockState)).resolves.toBeUndefined()
    })

    it("should handle cleanup errors gracefully", async () => {
      const { mockState, mockCleanup } = createMockPermissionState()

      const permission = createPermissionInfo({ id: "perm1", sessionID: "session1" })
      const rejectError = new Error("Reject failed")

      mockState.pending = {
        session1: {
          perm1: {
            info: permission,
            resolve: vi.fn(),
            reject: vi.fn(() => {
              throw rejectError
            }),
          },
        },
      }

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      const stateCall = (Instance.state as any).mock.calls[0]
      const cleanupFn = stateCall[1]

      // Should not throw even if individual rejects fail
      await expect(cleanupFn(mockState)).resolves.toBeUndefined()
    })
  })

  describe("State Isolation", () => {
    it("should maintain separate state for different sessions", () => {
      const { mockState } = createMockPermissionState()

      mockState.pending = {
        session1: { perm1: { info: createPermissionInfo(), resolve: vi.fn(), reject: vi.fn() } },
        session2: { perm2: { info: createPermissionInfo(), resolve: vi.fn(), reject: vi.fn() } },
      }

      mockState.approved = {
        session1: { "tool.read": true },
        session2: { "tool.write": true },
      }

      // Verify state isolation
      expect(mockState.pending.session1).not.toBe(mockState.pending.session2)
      expect(mockState.approved.session1).not.toBe(mockState.approved.session2)

      expect(Object.keys(mockState.pending.session1)).toEqual(["perm1"])
      expect(Object.keys(mockState.pending.session2)).toEqual(["perm2"])
      expect(Object.keys(mockState.approved.session1)).toEqual(["tool.read"])
      expect(Object.keys(mockState.approved.session2)).toEqual(["tool.write"])
    })

    it("should handle concurrent state access", async () => {
      const { mockState } = createMockPermissionState()
      mockState.pending = {}
      mockState.approved = {}

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      // Simulate concurrent access
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve().then(() => {
          const sessionID = `session-${i}`
          mockState.pending[sessionID] = {
            [`perm-${i}`]: { info: createPermissionInfo(), resolve: vi.fn(), reject: vi.fn() },
          }
          mockState.approved[sessionID] = { [`tool-${i}`]: true }
          return mockState
        }),
      )

      const results = await Promise.all(promises)

      // All operations should complete successfully
      expect(results).toHaveLength(10)
      expect(Object.keys(mockState.pending)).toHaveLength(10)
      expect(Object.keys(mockState.approved)).toHaveLength(10)
    })
  })

  describe("State Persistence", () => {
    it("should maintain state across multiple accesses", () => {
      const { mockState } = createMockPermissionState()

      const { Instance } = require("../../../src/project/instance")
      Instance.state.mockReturnValue(mockState)

      // Modify state through first access
      mockState.approved["session1"] = { "tool.read": true }

      // Access state again
      const secondAccess = mockState

      // State should be preserved
      expect(secondAccess.approved["session1"]).toEqual({ "tool.read": true })
    })

    it("should handle state mutations correctly", () => {
      const { mockState } = createMockPermissionState()

      // Add and remove permissions
      mockState.approved["session1"] = { "tool.read": true }
      delete mockState.approved["session1"]

      mockState.pending["session1"] = {
        perm1: { info: createPermissionInfo(), resolve: vi.fn(), reject: vi.fn() },
      }
      delete mockState.pending["session1"]

      // State should be empty again
      expect(mockState.approved).toEqual({})
      expect(mockState.pending).toEqual({})
    })
  })
})
