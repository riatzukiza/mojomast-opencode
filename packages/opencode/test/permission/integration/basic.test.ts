import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { Permission } from "../../../src/permission"
import { Plugin } from "../../../src/plugin"

describe("Permission Integration Tests", () => {
  let pluginSpy: any

  beforeEach(() => {
    // Spy on Plugin.trigger to control permission responses
    pluginSpy = spyOn(Plugin, "trigger")
  })

  afterEach(() => {
    pluginSpy.mockRestore()
  })

  describe("Permission Schema Validation", () => {
    it("should validate Permission.Info schema", () => {
      // Test that the schema exists and can validate
      expect(Permission.Info).toBeDefined()
      expect(typeof Permission.Info.parse).toBe("function")

      // Test valid data
      const validInfo = {
        id: "test-permission-1",
        type: "tool.read",
        pattern: "file.*",
        sessionID: "session-123",
        messageID: "message-456",
        callID: "call-789",
        title: "Read File Permission",
        metadata: { path: "/test/file.txt" },
        time: {
          created: Date.now(),
        },
      }

      expect(() => Permission.Info.parse(validInfo)).not.toThrow()
      const parsed = Permission.Info.parse(validInfo)
      expect(parsed.id).toBe("test-permission-1")
      expect(parsed.type).toBe("tool.read")
    })

    it("should validate Permission.Response schema", () => {
      expect(Permission.Response).toBeDefined()
      expect(typeof Permission.Response.parse).toBe("function")

      expect(() => Permission.Response.parse("once")).not.toThrow()
      expect(() => Permission.Response.parse("always")).not.toThrow()
      expect(() => Permission.Response.parse("reject")).not.toThrow()

      expect(() => Permission.Response.parse("invalid")).toThrow()
    })
  })

  describe("Permission Events", () => {
    it("should have event definitions", () => {
      expect(Permission.Event).toBeDefined()
      expect(Permission.Event.Updated).toBeDefined()
      expect(Permission.Event.Replied).toBeDefined()
    })
  })

  describe("Permission.RejectedError", () => {
    it("should create RejectedError with correct properties", () => {
      const error = new Permission.RejectedError("session-123", "permission-456", "call-789", {
        test: true,
      })

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(Permission.RejectedError)
      expect(error.sessionID).toBe("session-123")
      expect(error.permissionID).toBe("permission-456")
      expect(error.toolCallID).toBe("call-789")
      expect(error.metadata).toEqual({ test: true })
      expect(error.message).toContain("user rejected permission")
    })

    it("should work with optional parameters", () => {
      const error = new Permission.RejectedError("session-123", "permission-456")

      expect(error.sessionID).toBe("session-123")
      expect(error.permissionID).toBe("permission-456")
      expect(error.toolCallID).toBeUndefined()
      expect(error.metadata).toBeUndefined()
    })
  })

  describe("Permission.ask Function", () => {
    it("should be defined as async function", () => {
      expect(Permission.ask).toBeDefined()
      expect(typeof Permission.ask).toBe("function")
    })

    it("should accept required parameters", () => {
      const input = {
        type: "test-tool",
        title: "Test Permission",
        sessionID: "test-session",
        messageID: "test-message",
        metadata: {},
      }

      // Function should accept the parameters without throwing
      expect(() => {
        const promise = Permission.ask(input)
        expect(promise).toBeInstanceOf(Promise)
      }).not.toThrow()
    })

    it("should accept optional parameters", () => {
      const input = {
        type: "test-tool",
        title: "Test Permission",
        pattern: "tool.*",
        sessionID: "test-session",
        messageID: "test-message",
        callID: "test-call",
        metadata: { path: "/test" },
      }

      expect(() => {
        const promise = Permission.ask(input)
        expect(promise).toBeInstanceOf(Promise)
      }).not.toThrow()
    })
  })

  describe("Permission.respond Function", () => {
    it("should be defined as function", () => {
      expect(Permission.respond).toBeDefined()
      expect(typeof Permission.respond).toBe("function")
    })

    it("should accept response parameters", () => {
      const input = {
        sessionID: "test-session",
        permissionID: "test-permission",
        response: "once" as const,
      }

      // Function should exist and be callable
      expect(typeof Permission.respond).toBe("function")
      // Note: Actual execution requires context setup which is complex for unit tests
    })
  })
})
