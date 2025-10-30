import { describe, it, expect, beforeEach, vi } from "vitest"
import { Permission } from "../../../src/permission"
import { Wildcard } from "../../../src/util/wildcard"

// Mock Wildcard dependency
vi.mock("../../../src/util/wildcard", () => ({
  Wildcard: {
    match: vi.fn(),
  },
}))

const mockWildcardMatch = Wildcard.match as any

describe("Permission Utility Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("toKeys function", () => {
    // We need to access the private function through testing
    // Since it's not exported, we'll test it indirectly through the public API
    it("should handle undefined pattern by returning type as array", async () => {
      mockWildcardMatch.mockReturnValue(true)

      // Create a mock state to test the behavior
      const mockState = {
        pending: {},
        approved: {
          "test-session": {
            "some-type": true,
          },
        },
      }

      // Test through the covered function which uses toKeys internally
      const result = (Permission as any).covered(["test-type"], mockState.approved["test-session"])
      expect(result).toBe(false) // Since "test-type" != "some-type"
    })

    it("should handle string pattern by returning pattern as array", () => {
      // This is tested indirectly through the public API
      const mockState = {
        pending: {},
        approved: {
          "test-session": {
            "tool.read": true,
          },
        },
      }

      const result = (Permission as any).covered(["tool.read"], mockState.approved["test-session"])
      expect(result).toBe(true)
    })

    it("should handle array pattern by returning pattern as-is", () => {
      const mockState = {
        pending: {},
        approved: {
          "test-session": {
            "tool.read": true,
            "tool.write": true,
          },
        },
      }

      const result = (Permission as any).covered(
        ["tool.read", "tool.write"],
        mockState.approved["test-session"],
      )
      expect(result).toBe(true)
    })
  })

  describe("covered function", () => {
    beforeEach(() => {
      mockWildcardMatch.mockReturnValue(true)
    })

    it("should return true when all keys are covered by approved patterns", () => {
      const approved = {
        "tool.*": true,
        "file.read": true,
      }

      mockWildcardMatch.mockImplementation((str, pattern) => {
        if (str === "tool.read" && pattern === "tool.*") return true
        if (str === "tool.write" && pattern === "tool.*") return true
        return false
      })

      const keys = ["tool.read", "tool.write"]
      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(true)
      expect(mockWildcardMatch).toHaveBeenCalledTimes(4) // 2 keys × 2 patterns
    })

    it("should return false when some keys are not covered", () => {
      const approved = {
        "tool.read": true,
      }

      mockWildcardMatch.mockImplementation((str, pattern) => {
        return str === "tool.read" && pattern === "tool.read"
      })

      const keys = ["tool.read", "tool.write"]
      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(false)
    })

    it("should return false when no keys are covered", () => {
      const approved = {
        "file.read": true,
      }

      mockWildcardMatch.mockReturnValue(false)

      const keys = ["tool.read", "tool.write"]
      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(false)
    })

    it("should handle empty approved list", () => {
      const approved = {}
      const keys = ["tool.read"]

      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(false)
    })

    it("should handle empty keys list", () => {
      const approved = {
        "tool.*": true,
      }
      const keys: string[] = []

      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(true) // Every element of empty array is covered
    })

    it("should work with complex wildcard patterns", () => {
      const approved = {
        "tool.read.*.file": true,
        "tool.write.**": true,
      }

      mockWildcardMatch.mockImplementation((str, pattern) => {
        if (str === "tool.read.project.file" && pattern === "tool.read.*.file") return true
        if (str === "tool.write.anything" && pattern === "tool.write.**") return true
        return false
      })

      const keys = ["tool.read.project.file", "tool.write.anything"]
      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(true)
    })

    it("should handle special characters in patterns and keys", () => {
      const approved = {
        "tool.read.特殊-文件": true,
        "tool.write.*": true,
      }

      mockWildcardMatch.mockImplementation((str, pattern) => {
        if (str === "tool.read.特殊-文件" && pattern === "tool.read.特殊-文件") return true
        if (str === "tool.write.test" && pattern === "tool.write.*") return true
        return false
      })

      const keys = ["tool.read.特殊-文件", "tool.write.test"]
      const result = (Permission as any).covered(keys, approved)

      expect(result).toBe(true)
    })
  })

  describe("Integration with Wildcard.match", () => {
    it("should call Wildcard.match with correct parameters", () => {
      const approved = {
        "tool.*": true,
      }

      mockWildcardMatch.mockImplementation((str, pattern) => {
        expect(typeof str).toBe("string")
        expect(typeof pattern).toBe("string")
        return str.startsWith("tool.") && pattern === "tool.*"
      })

      const keys = ["tool.read", "tool.write"](Permission as any).covered(keys, approved)

      expect(mockWildcardMatch).toHaveBeenCalledWith("tool.read", "tool.*")
      expect(mockWildcardMatch).toHaveBeenCalledWith("tool.write", "tool.*")
    })

    it("should handle Wildcard.match errors gracefully", () => {
      const approved = {
        "tool.*": true,
      }

      mockWildcardMatch.mockImplementation(() => {
        throw new Error("Wildcard match error")
      })

      const keys = ["tool.read"]

      expect(() => {
        ;(Permission as any).covered(keys, approved)
      }).toThrow("Wildcard match error")
    })
  })
})
