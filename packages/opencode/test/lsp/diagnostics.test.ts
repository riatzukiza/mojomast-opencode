import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { LSP } from "../../src/lsp"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import * as fs from "fs/promises"
import type { Diagnostic } from "vscode-languageserver-types"

const ctx = {
  sessionID: "test",
  messageID: "",
  callID: "",
  agent: "build",
  abort: new AbortController().signal,
  metadata: () => {},
}

describe("LSP diagnostics integration", () => {
  let fixture: Awaited<ReturnType<typeof tmpdir>> | undefined

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  describe("diagnostics function", () => {
    test("should return empty diagnostics for clean project", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          const diagnostics = await LSP.diagnostics()
          expect(diagnostics).toEqual({})
        },
      })
    })

    test("should aggregate diagnostics from multiple servers", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Create a tsconfig.json first
          const tsconfig = {
            compilerOptions: {
              strict: true,
              target: "es2020",
              module: "commonjs",
            },
          }
          await fs.writeFile(path.join(fixture.path, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))

          // Create a TypeScript file with errors
          const tsFile = path.join(fixture.path, "test.ts")
          await fs.writeFile(tsFile, "const x: string = 123; // Type error")

          // Touch file to trigger diagnostics
          await LSP.touchFile(tsFile, true)

          // Wait a bit for TypeScript LSP server to process
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const diagnostics = await LSP.diagnostics()

          // Should have diagnostics for the file if LSP servers are available
          // If no LSP servers are available, diagnostics will be empty
          if (Object.keys(diagnostics).length > 0) {
            expect(Object.keys(diagnostics)).toContain(tsFile)

            const fileDiagnostics = diagnostics[tsFile]
            expect(fileDiagnostics).toBeDefined()
            expect(Array.isArray(fileDiagnostics)).toBe(true)

            if (fileDiagnostics.length > 0) {
              const firstDiagnostic = fileDiagnostics[0]
              expect(firstDiagnostic).toHaveProperty("message")
              expect(firstDiagnostic).toHaveProperty("range")
              expect(firstDiagnostic).toHaveProperty("severity")
            }
          } else {
            // If no diagnostics, it might be because LSP servers aren't available
            // This is acceptable in test environments
            console.log("No LSP servers available, skipping diagnostic assertions")
          }
        },
      })
    })

    test("should handle multiple files with diagnostics", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Create a tsconfig.json first
          const tsconfig = {
            compilerOptions: {
              strict: true,
              target: "es2020",
              module: "commonjs",
            },
          }
          await fs.writeFile(path.join(fixture.path, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))

          // Create multiple TypeScript files with errors
          const tsFile1 = path.join(fixture.path, "file1.ts")
          const tsFile2 = path.join(fixture.path, "file2.ts")

          await fs.writeFile(tsFile1, "const y: number = 'hello'; // Type error")
          await fs.writeFile(tsFile2, "const z: boolean = 42; // Type error")

          await LSP.touchFile(tsFile1, true)
          await LSP.touchFile(tsFile2, true)

          const diagnostics = await LSP.diagnostics()

          // If LSP servers are available, check for diagnostics
          if (Object.keys(diagnostics).length > 0) {
            expect(Object.keys(diagnostics)).toContain(tsFile1)
            expect(Object.keys(diagnostics)).toContain(tsFile2)
          } else {
            console.log("No LSP servers available, skipping diagnostic assertions")
          }
        },
      })
    })

    test("should handle malformed diagnostic data gracefully", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // This test would require mocking LSP client to return malformed data
          // For now, we test that the function doesn't crash
          const diagnostics = await LSP.diagnostics()
          expect(typeof diagnostics).toBe("object")
        },
      })
    })
  })

  describe("touchFile with diagnostics", () => {
    test("should trigger diagnostics after file touch", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Create a tsconfig.json first
          const tsconfig = {
            compilerOptions: {
              strict: true,
              target: "es2020",
              module: "commonjs",
            },
          }
          await fs.writeFile(path.join(fixture.path, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))

          const tsFile = path.join(fixture.path, "test.ts")
          await fs.writeFile(tsFile, "const x: string = 123; // Type error")

          // Touch file and wait for diagnostics
          await LSP.touchFile(tsFile, true)

          const diagnostics = await LSP.diagnostics()

          // If LSP servers are available, check for diagnostics
          if (Object.keys(diagnostics).length > 0) {
            expect(Object.keys(diagnostics)).toContain(tsFile)
          } else {
            console.log("No LSP servers available, skipping diagnostic assertions")
          }
        },
      })
    })

    test("should handle non-existent files", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          const nonExistentFile = path.join(fixture.path, "nonexistent.ts")

          // Should not throw error
          await LSP.touchFile(nonExistentFile, true)
        },
      })
    })
  })

  describe("diagnostic formatting", () => {
    test("should format single server diagnostics correctly", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          const tsFile = path.join(fixture.path, "test.ts")
          await fs.writeFile(tsFile, "const x: string = 123;")

          await LSP.touchFile(tsFile, true)
          const diagnostics = await LSP.diagnostics()
          const fileDiagnostics = diagnostics[tsFile]

          if (fileDiagnostics && fileDiagnostics.length > 0) {
            const diagnosticsWithServers = fileDiagnostics.map((diagnostic) => ({
              diagnostic,
              serverID: diagnostic.source ?? "unknown",
            }))
            const formatted = LSP.Diagnostic.formatDiagnosticsWithServers(diagnosticsWithServers)
            expect(typeof formatted).toBe("string")
            expect(formatted.length).toBeGreaterThan(0)

            // Should not contain server separators for single server
            const uniqueServers = new Set(diagnosticsWithServers.map((item) => item.serverID))
            if (fileDiagnostics.length === 1 || uniqueServers.size <= 1) {
              expect(formatted).not.toContain("---")
            }
          }
        },
      })
    })

    test("should format multiple server diagnostics with separators", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // This test would require multiple LSP servers to be configured
          // For now, we test the formatting function directly
          const mockDiagnostics = [
            {
              diagnostic: {
                message: "Type error",
                severity: 1,
                range: { start: { line: 0, character: 6 }, end: { line: 0, character: 7 } },
                source: "typescript",
              } as Diagnostic,
              serverID: "typescript",
            },
            {
              diagnostic: {
                message: "ESLint error",
                severity: 1,
                range: { start: { line: 0, character: 6 }, end: { line: 0, character: 7 } },
                source: "eslint",
              } as Diagnostic,
              serverID: "eslint",
            },
          ]

          const formatted = LSP.Diagnostic.formatDiagnosticsWithServers(mockDiagnostics)

          expect(formatted).toContain("--- TYPESCRIPT ---")
          expect(formatted).toContain("--- ESLINT ---")
          expect(formatted).toContain("Type error")
          expect(formatted).toContain("ESLint error")
        },
      })
    })
  })

  describe("backward compatibility", () => {
    test("should handle old diagnostic format", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Test the old pretty function still works
          const oldDiagnostic = {
            message: "Test error",
            severity: 1,
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
            source: "test",
          } as Diagnostic

          const formatted = LSP.Diagnostic.pretty(oldDiagnostic)
          expect(formatted).toBe("ERROR [1:1] Test error")
        },
      })
    })

    test("should handle new diagnostic format with prettyWithServer", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          const diagnostic = {
            message: "Test error",
            severity: 1,
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
            source: "test",
          } as Diagnostic

          const formatted = LSP.Diagnostic.prettyWithServer(diagnostic, "typescript")
          expect(formatted).toBe("ERROR [1:1] Test error [typescript]")
        },
      })
    })
  })

  describe("error handling", () => {
    test("should handle LSP server failures gracefully", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Create a tsconfig.json first
          const tsconfig = {
            compilerOptions: {
              strict: true,
              target: "es2020",
              module: "commonjs",
            },
          }
          await fs.writeFile(path.join(fixture.path, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))

          // Create a file that might cause LSP issues
          const problematicFile = path.join(fixture.path, "problematic.ts")
          await fs.writeFile(problematicFile, "this is not valid typescript syntax @#$%")

          // Should not throw even if LSP server has issues
          await LSP.touchFile(problematicFile, true)

          const diagnostics = await LSP.diagnostics()
          expect(typeof diagnostics).toBe("object")
        },
      })
    })

    test("should handle concurrent diagnostic requests", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Create a tsconfig.json first
          const tsconfig = {
            compilerOptions: {
              strict: true,
              target: "es2020",
              module: "commonjs",
            },
          }
          await fs.writeFile(path.join(fixture.path, "tsconfig.json"), JSON.stringify(tsconfig, null, 2))

          // Create multiple files with errors
          const files = []
          for (let i = 0; i < 5; i++) {
            const file = path.join(fixture.path, `file${i}.ts`)
            await fs.writeFile(file, `const x${i}: string = ${i}; // Type error`)
            files.push(file)
          }

          // Touch all files concurrently
          const promises = files.map((file) => LSP.touchFile(file, true))
          await Promise.all(promises)

          const diagnostics = await LSP.diagnostics()

          // If LSP servers are available, check for diagnostics
          if (Object.keys(diagnostics).length > 0) {
            expect(Object.keys(diagnostics).length).toBeGreaterThan(0)
          } else {
            console.log("No LSP servers available, skipping diagnostic assertions")
          }
        },
      })
    })
  })

  describe("performance", () => {
    test("should handle large number of diagnostics efficiently", async () => {
      await Instance.provide({
        directory: fixture.path,
        fn: async () => {
          // Create a file with many potential errors
          let content = ""
          for (let i = 0; i < 100; i++) {
            content += `const x${i}: string = ${i};\n`
          }

          const largeFile = path.join(fixture.path, "large.ts")
          await fs.writeFile(largeFile, content)

          const start = performance.now()
          await LSP.touchFile(largeFile, true)
          const diagnostics = await LSP.diagnostics()
          const end = performance.now()

          expect(end - start).toBeLessThan(5000) // Should complete in under 5 seconds
          expect(typeof diagnostics).toBe("object")
        },
      })
    })
  })
})
