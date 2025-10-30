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

describe("Permission.ask function", () => {
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

  describe("Basic Permission Request Functionality", () => {
    it("should be an async function", () => {
      expect(typeof Permission.ask).toBe("function")
      expect(Permission.ask.constructor.name).toBe("AsyncFunction")
    })

    it("should accept permission input parameters", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Should not throw when called with valid input
      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)
    })

    it("should call Plugin.trigger when permission is requested", async () => {
      const { Plugin } = require("../../../src/plugin")
      Plugin.trigger.mockResolvedValue({ status: "ask" })

      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      const promise = Permission.ask(input)
      expect(promise).toBeInstanceOf(Promise)
      expect(Plugin.trigger).toHaveBeenCalled()
    })
  })
})
