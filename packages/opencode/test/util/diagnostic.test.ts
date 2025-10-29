import { describe, expect, test } from "bun:test"
import type { Diagnostic, DiagnosticSeverity } from "vscode-languageserver-types"
import {
  isMultiServerFormat,
  sanitizeServerID,
  groupDiagnosticsByServer,
  formatDiagnosticWithServer,
  formatDiagnosticsWithServers,
  filterDiagnosticsBySeverity,
  getErrorDiagnostics,
  validateDiagnostic,
  validateDiagnosticItem,
} from "../../src/util/diagnostic"

// Test data helpers
function createDiagnostic(
  message: string,
  severity: DiagnosticSeverity = 1 as DiagnosticSeverity,
  line: number = 1,
  character: number = 1,
): Diagnostic {
  return {
    message,
    severity,
    range: {
      start: { line, character },
      end: { line, character: character + message.length },
    },
    source: "test",
  }
}

function createDiagnosticItem(
  message: string,
  serverID: string,
  severity: DiagnosticSeverity = 1 as DiagnosticSeverity,
): { diagnostic: Diagnostic; serverID: string } {
  return {
    diagnostic: createDiagnostic(message, severity),
    serverID,
  }
}

describe("diagnostic utilities", () => {
  describe("isMultiServerFormat", () => {
    test("should identify multi-server format correctly", () => {
      const multiServer = [createDiagnosticItem("error", "typescript")]
      expect(isMultiServerFormat(multiServer)).toBe(true)
    })

    test("should identify old format correctly", () => {
      const oldFormat = [createDiagnostic("error")]
      expect(isMultiServerFormat(oldFormat)).toBe(false)
    })

    test("should handle empty arrays", () => {
      const empty: any[] = []
      expect(isMultiServerFormat(empty)).toBe(false)
    })
  })

  describe("sanitizeServerID", () => {
    test("should remove HTML tags", () => {
      expect(sanitizeServerID("<script>alert('xss')</script>")).toBe("alert('xss')")
      expect(sanitizeServerID("typescript<test>")).toBe("typescript")
    })

    test("should trim whitespace", () => {
      expect(sanitizeServerID("  typescript  ")).toBe("typescript")
    })

    test("should handle empty strings", () => {
      expect(sanitizeServerID("")).toBe("")
      expect(sanitizeServerID("   ")).toBe("")
    })

    test("should preserve valid characters", () => {
      expect(sanitizeServerID("typescript-eslint")).toBe("typescript-eslint")
      expect(sanitizeServerID("pylance")).toBe("pylance")
    })
  })

  describe("groupDiagnosticsByServer", () => {
    test("should group diagnostics by server", () => {
      const diagnostics = [
        createDiagnosticItem("error1", "typescript"),
        createDiagnosticItem("error2", "pylance"),
        createDiagnosticItem("error3", "typescript"),
      ]

      const grouped = groupDiagnosticsByServer(diagnostics)

      expect(Object.keys(grouped)).toHaveLength(2)
      expect(grouped.typescript).toHaveLength(2)
      expect(grouped.pylance).toHaveLength(1)
      expect(grouped.typescript[0].message).toBe("error1")
      expect(grouped.typescript[1].message).toBe("error3")
      expect(grouped.pylance[0].message).toBe("error2")
    })

    test("should handle empty server IDs", () => {
      const diagnostics = [createDiagnosticItem("error1", ""), createDiagnosticItem("error2", "typescript")]

      const grouped = groupDiagnosticsByServer(diagnostics)

      expect(Object.keys(grouped)).toHaveLength(2)
      expect(grouped.Unknown).toHaveLength(1)
      expect(grouped.typescript).toHaveLength(1)
    })

    test("should handle empty input", () => {
      const grouped = groupDiagnosticsByServer([])
      expect(grouped).toEqual({})
    })

    test("should sanitize server IDs", () => {
      const diagnostics = [
        createDiagnosticItem("error1", "<typescript>"),
        createDiagnosticItem("error2", "  pylance  "),
      ]

      const grouped = groupDiagnosticsByServer(diagnostics)

      expect(Object.keys(grouped)).toHaveLength(2)
      expect(grouped.typescript).toBeDefined()
      expect(grouped.pylance).toBeDefined()
      expect(grouped.typescript).toHaveLength(1)
      expect(grouped.pylance).toHaveLength(1)
    })
  })

  describe("formatDiagnosticWithServer", () => {
    test("should format diagnostic correctly", () => {
      const diagnostic = createDiagnostic("Test error", 1, 5, 10)
      const formatted = formatDiagnosticWithServer(diagnostic, "typescript")

      expect(formatted).toBe("ERROR [6:11] Test error")
    })

    test("should handle different severity levels", () => {
      const error = createDiagnostic("Error", 1)
      const warning = createDiagnostic("Warning", 2)
      const info = createDiagnostic("Info", 3)
      const hint = createDiagnostic("Hint", 4)

      expect(formatDiagnosticWithServer(error, "test")).toContain("ERROR")
      expect(formatDiagnosticWithServer(warning, "test")).toContain("WARN")
      expect(formatDiagnosticWithServer(info, "test")).toContain("INFO")
      expect(formatDiagnosticWithServer(hint, "test")).toContain("HINT")
    })

    test("should default to ERROR for undefined severity", () => {
      const diagnostic = createDiagnostic("Test", undefined as any)
      const formatted = formatDiagnosticWithServer(diagnostic, "test")

      expect(formatted).toContain("ERROR")
    })
  })

  describe("formatDiagnosticsWithServers", () => {
    test("should format single server without separators", () => {
      const diagnostics = [createDiagnosticItem("error1", "typescript"), createDiagnosticItem("error2", "typescript")]

      const formatted = formatDiagnosticsWithServers(diagnostics)

      expect(formatted).not.toContain("---")
      expect(formatted).toContain("ERROR [2:2] error1")
      expect(formatted).toContain("ERROR [2:2] error2")
    })

    test("should format multiple servers with separators", () => {
      const diagnostics = [createDiagnosticItem("error1", "typescript"), createDiagnosticItem("error2", "pylance")]

      const formatted = formatDiagnosticsWithServers(diagnostics)

      expect(formatted).toContain("--- TYPESCRIPT ---")
      expect(formatted).toContain("--- PYLANCE ---")
      expect(formatted).toContain("ERROR [2:2] error1")
      expect(formatted).toContain("ERROR [2:2] error2")
    })

    test("should handle empty input", () => {
      const formatted = formatDiagnosticsWithServers([])
      expect(formatted).toBe("")
    })

    test("should maintain order of servers", () => {
      const diagnostics = [
        createDiagnosticItem("error1", "typescript"),
        createDiagnosticItem("error2", "pylance"),
        createDiagnosticItem("error3", "eslint"),
      ]

      const formatted = formatDiagnosticsWithServers(diagnostics)
      const lines = formatted.split("\n")

      expect(lines[0]).toBe("--- TYPESCRIPT ---")
      expect(lines[1]).toBe("ERROR [2:2] error1")
      expect(lines[2]).toBe("")
      expect(lines[3]).toBe("--- PYLANCE ---")
      expect(lines[4]).toBe("ERROR [2:2] error2")
      expect(lines[5]).toBe("")
      expect(lines[6]).toBe("--- ESLINT ---")
      expect(lines[7]).toBe("ERROR [2:2] error3")
    })
  })

  describe("filterDiagnosticsBySeverity", () => {
    test("should filter by severity correctly", () => {
      const diagnostics = [
        createDiagnosticItem("error", "test", 1),
        createDiagnosticItem("warning", "test", 2),
        createDiagnosticItem("info", "test", 3),
        createDiagnosticItem("hint", "test", 4),
      ]

      const errors = filterDiagnosticsBySeverity(diagnostics, 1)
      const warnings = filterDiagnosticsBySeverity(diagnostics, 2)

      expect(errors).toHaveLength(1)
      expect(warnings).toHaveLength(1)
      expect(errors[0].diagnostic.message).toBe("error")
      expect(warnings[0].diagnostic.message).toBe("warning")
    })

    test("should handle empty input", () => {
      const filtered = filterDiagnosticsBySeverity([], 1)
      expect(filtered).toHaveLength(0)
    })
  })

  describe("getErrorDiagnostics", () => {
    test("should return only error diagnostics", () => {
      const diagnostics = [
        createDiagnosticItem("error1", "test", 1),
        createDiagnosticItem("warning", "test", 2),
        createDiagnosticItem("error2", "test", 1),
      ]

      const errors = getErrorDiagnostics(diagnostics)

      expect(errors).toHaveLength(2)
      expect(errors[0].diagnostic.message).toBe("error1")
      expect(errors[1].diagnostic.message).toBe("error2")
    })
  })

  describe("validateDiagnostic", () => {
    test("should validate correct diagnostic structure", () => {
      const valid = createDiagnostic("test")
      expect(validateDiagnostic(valid)).toBe(true)
    })

    test("should reject invalid diagnostic structure", () => {
      const invalid = { message: "test" } // missing range
      const result = validateDiagnostic(invalid)
      expect(result).toBe(false)
    })

    test("should reject null/undefined", () => {
      expect(validateDiagnostic(null)).toBe(false)
      expect(validateDiagnostic(undefined)).toBe(false)
    })

    test("should reject non-object types", () => {
      expect(validateDiagnostic("string")).toBe(false)
      expect(validateDiagnostic(123)).toBe(false)
    })
  })

  describe("validateDiagnosticItem", () => {
    test("should validate correct diagnostic item structure", () => {
      const valid = createDiagnosticItem("test", "typescript")
      expect(validateDiagnosticItem(valid)).toBe(true)
    })

    test("should reject invalid diagnostic item structure", () => {
      const invalid = { diagnostic: "invalid", serverID: "test" }
      expect(validateDiagnosticItem(invalid)).toBe(false)
    })

    test("should reject null/undefined", () => {
      expect(validateDiagnosticItem(null)).toBe(false)
      expect(validateDiagnosticItem(undefined)).toBe(false)
    })
  })

  describe("performance tests", () => {
    test("should handle large diagnostic sets efficiently", () => {
      const largeDiagnostics: Array<{ diagnostic: Diagnostic; serverID: string }> = []

      // Create 1000 diagnostics across 10 servers
      for (let i = 0; i < 1000; i++) {
        const serverID = `server${i % 10}`
        largeDiagnostics.push(createDiagnosticItem(`error${i}`, serverID))
      }

      const start = performance.now()
      const grouped = groupDiagnosticsByServer(largeDiagnostics)
      const formatted = formatDiagnosticsWithServers(largeDiagnostics)
      const end = performance.now()

      expect(Object.keys(grouped)).toHaveLength(10)
      expect(formatted.length).toBeGreaterThan(0)
      expect(end - start).toBeLessThan(100) // Should complete in under 100ms
    })
  })
})
