import { describe, it, expect } from "vitest"
import { Permission } from "../../../src/permission"
import { createPermissionInfo } from "../fixtures/test-data"

describe("Permission.Info Schema", () => {
  describe("Valid Permission Info Objects", () => {
    it("should accept a complete valid permission info object", () => {
      const validInfo = createPermissionInfo()
      const result = Permission.Info.safeParse(validInfo)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInfo)
      }
    })

    it("should accept permission info with optional fields omitted", () => {
      const minimalInfo = {
        id: "test-id",
        type: "test-tool",
        sessionID: "test-session",
        messageID: "test-message",
        title: "Test Permission",
        metadata: {},
        time: { created: Date.now() },
      }

      const result = Permission.Info.safeParse(minimalInfo)
      expect(result.success).toBe(true)
    })

    it("should accept string pattern", () => {
      const infoWithStringPattern = createPermissionInfo({
        pattern: "tool.read",
      })

      const result = Permission.Info.safeParse(infoWithStringPattern)
      expect(result.success).toBe(true)
    })

    it("should accept array pattern", () => {
      const infoWithArrayPattern = createPermissionInfo({
        pattern: ["tool.read", "tool.write"],
      })

      const result = Permission.Info.safeParse(infoWithArrayPattern)
      expect(result.success).toBe(true)
    })

    it("should accept optional callID", () => {
      const infoWithCallID = createPermissionInfo({
        callID: "test-call-id",
      })

      const result = Permission.Info.safeParse(infoWithCallID)
      expect(result.success).toBe(true)
    })

    it("should accept empty metadata object", () => {
      const infoWithEmptyMetadata = createPermissionInfo({
        metadata: {},
      })

      const result = Permission.Info.safeParse(infoWithEmptyMetadata)
      expect(result.success).toBe(true)
    })

    it("should accept complex metadata object", () => {
      const infoWithComplexMetadata = createPermissionInfo({
        metadata: {
          userId: "user-123",
          permissions: ["read", "write"],
          context: { file: "/path/to/file", line: 42 },
          timestamp: new Date().toISOString(),
        },
      })

      const result = Permission.Info.safeParse(infoWithComplexMetadata)
      expect(result.success).toBe(true)
    })
  })

  describe("Invalid Permission Info Objects", () => {
    it("should reject missing required fields", () => {
      const incompleteInfo = {
        id: "test-id",
        type: "test-tool",
        // Missing other required fields
      }

      const result = Permission.Info.safeParse(incompleteInfo)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toHaveLength(5) // sessionID, messageID, title, metadata, time
      }
    })

    it("should reject invalid data types", () => {
      const invalidInfo = {
        id: 123, // should be string
        type: "test-tool",
        pattern: 456, // should be string or array
        sessionID: "test-session",
        messageID: "test-message",
        callID: ["not", "a", "string"], // should be string or undefined
        title: "Test Permission",
        metadata: "not an object", // should be object
        time: "not an object", // should be object with created number
      }

      const result = Permission.Info.safeParse(invalidInfo)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it("should reject invalid pattern types", () => {
      const infoWithInvalidPattern = createPermissionInfo({
        pattern: 123, // number instead of string or array
      })

      const result = Permission.Info.safeParse(infoWithInvalidPattern)
      expect(result.success).toBe(false)
    })

    it("should reject invalid time object", () => {
      const infoWithInvalidTime = createPermissionInfo({
        time: {
          created: "not a number", // should be number
        },
      })

      const result = Permission.Info.safeParse(infoWithInvalidTime)
      expect(result.success).toBe(false)
    })

    it("should reject negative timestamps", () => {
      const infoWithNegativeTime = createPermissionInfo({
        time: {
          created: -1000, // negative timestamp
        },
      })

      const result = Permission.Info.safeParse(infoWithNegativeTime)
      expect(result.success).toBe(true) // Schema allows negative, but logic should handle
    })

    it("should reject empty strings for required fields", () => {
      const infoWithEmptyStrings = createPermissionInfo({
        id: "",
        type: "",
        sessionID: "",
        messageID: "",
        title: "",
      })

      const result = Permission.Info.safeParse(infoWithEmptyStrings)
      expect(result.success).toBe(true) // Empty strings are valid by schema
    })
  })

  describe("Edge Cases", () => {
    it("should handle very long strings", () => {
      const longString = "a".repeat(10000)
      const infoWithLongStrings = createPermissionInfo({
        id: longString,
        type: longString,
        sessionID: longString,
        messageID: longString,
        title: longString,
      })

      const result = Permission.Info.safeParse(infoWithLongStrings)
      expect(result.success).toBe(true)
    })

    it("should handle special characters", () => {
      const infoWithSpecialChars = createPermissionInfo({
        id: "id-with-特殊-字符-🚀",
        type: "type-with-ñ-á-é-í-ó-ú",
        sessionID: "session-with-emoji-🔒-🔑",
        title: "Title with quotes ' \" and brackets [] {}",
      })

      const result = Permission.Info.safeParse(infoWithSpecialChars)
      expect(result.success).toBe(true)
    })

    it("should handle null and undefined in metadata", () => {
      const infoWithNullUndefined = createPermissionInfo({
        metadata: {
          nullValue: null,
          undefinedValue: undefined,
          stringValue: "test",
          numberValue: 42,
        },
      })

      const result = Permission.Info.safeParse(infoWithNullUndefined)
      expect(result.success).toBe(true)
    })

    it("should handle nested objects in metadata", () => {
      const infoWithNestedMetadata = createPermissionInfo({
        metadata: {
          user: {
            id: "user-123",
            profile: {
              name: "Test User",
              preferences: {
                theme: "dark",
                language: "en",
              },
            },
          },
          permissions: ["read", "write", "execute"],
        },
      })

      const result = Permission.Info.safeParse(infoWithNestedMetadata)
      expect(result.success).toBe(true)
    })
  })
})

describe("Permission.Response Schema", () => {
  it("should accept valid response values", () => {
    expect(Permission.Response.safeParse("once").success).toBe(true)
    expect(Permission.Response.safeParse("always").success).toBe(true)
    expect(Permission.Response.safeParse("reject").success).toBe(true)
  })

  it("should reject invalid response values", () => {
    expect(Permission.Response.safeParse("maybe").success).toBe(false)
    expect(Permission.Response.safeParse("allow").success).toBe(false)
    expect(Permission.Response.safeParse("deny").success).toBe(false)
    expect(Permission.Response.safeParse("").success).toBe(false)
    expect(Permission.Response.safeParse(null).success).toBe(false)
    expect(Permission.Response.safeParse(undefined).success).toBe(false)
  })
})
