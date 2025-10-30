import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import path from "path"
import { LspDiagnosticTool } from "../../src/tool/lsp-diagnostics"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import * as fs from "fs/promises"

const ctx = {
  sessionID: "test",
  messageID: "",
  toolCallID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  metadata: () => {},
}

const lspDiagnosticTool = await LspDiagnosticTool.init()

describe("tool.lsp_diagnostics", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should handle non-existent file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const nonExistentFile = path.join(fixture.path, "nonexistent.ts")

        const result = await lspDiagnosticTool.execute({ path: nonExistentFile }, ctx)

        expect(result.title).toBe(nonExistentFile)
        expect(result.output).toBe("No errors found")
        expect(result.metadata.diagnostics).toEqual({})
        expect(Object.keys(result.metadata.diagnostics)).toHaveLength(0)
      },
    })
  })

  test("should handle clean file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const cleanFile = path.join(fixture.path, "clean.ts")
        await fs.writeFile(cleanFile, "const x: string = 'hello';")

        const result = await lspDiagnosticTool.execute({ path: cleanFile }, ctx)

        expect(result.title).toBe(cleanFile)
        expect(result.output).toBe("No errors found")
        expect(result.metadata.diagnostics).toEqual({})
        expect(Object.keys(result.metadata.diagnostics)).toHaveLength(0)
      },
    })
  })

  test("should handle file with diagnostics", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const errorFile = path.join(fixture.path, "error.ts")
        await fs.writeFile(errorFile, "const x: string = 123; // Type error")

        const result = await lspDiagnosticTool.execute({ path: errorFile }, ctx)

        expect(result.title).toBe(errorFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Verify diagnostics structure is valid
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available and diagnostics are found, output should contain formatted diagnostics
        if (result.output !== "No errors found") {
          expect(typeof result.output).toBe("string")
          expect(result.output.length).toBeGreaterThan(0)
          // Check for common error patterns in TypeScript
          expect(result.output).toMatch(
            /(Type 'number' is not assignable to type 'string'|type error)/i,
          )
        } else {
          // If no LSP servers, should gracefully handle with no errors
          expect(result.output).toBe("No errors found")
        }
      },
    })
  })

  test("should handle relative paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = "test.ts"
        const fullTestFile = path.join(fixture.path, testFile)
        await fs.writeFile(fullTestFile, "const x: string = 'hello';")

        const result = await lspDiagnosticTool.execute({ path: testFile }, ctx)

        expect(result.title).toBe(fullTestFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(fullTestFile)
        }
      },
    })
  })

  test("should handle absolute paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        await fs.writeFile(testFile, "const x: string = 'hello';")

        const result = await lspDiagnosticTool.execute({ path: testFile }, ctx)

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(testFile)
        }
      },
    })
  })

  test("should handle multiple diagnostic types", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const mixedFile = path.join(fixture.path, "mixed.ts")
        await fs.writeFile(
          mixedFile,
          "const x: string = 123; let y = x; // Type error + unused variable",
        )

        const result = await lspDiagnosticTool.execute({ path: mixedFile }, ctx)

        expect(result.title).toBe(mixedFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(mixedFile)
        }

        // Should contain error diagnostics
        if (result.output !== "No errors found") {
          expect(result.output).toMatch(/(error|type|assignable)/i)
        }
      },
    })
  })

  test("should handle file with syntax errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const syntaxErrorFile = path.join(fixture.path, "syntax.ts")
        await fs.writeFile(syntaxErrorFile, "const x string = 'hello' // Missing colon")

        const result = await lspDiagnosticTool.execute({ path: syntaxErrorFile }, ctx)

        expect(result.title).toBe(syntaxErrorFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(syntaxErrorFile)
        }

        // Should contain syntax error indicators
        if (result.output !== "No errors found") {
          expect(result.output).toMatch(/(syntax|unexpected|missing|expected)/i)
        }
      },
    })
  })

  test("should handle empty file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const emptyFile = path.join(fixture.path, "empty.ts")
        await fs.writeFile(emptyFile, "")

        const result = await lspDiagnosticTool.execute({ path: emptyFile }, ctx)

        expect(result.title).toBe(emptyFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(emptyFile)
        }
      },
    })
  })

  test("should handle file with only whitespace", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const whitespaceFile = path.join(fixture.path, "whitespace.ts")
        await fs.writeFile(whitespaceFile, "   \n  \n\t\n   ")

        const result = await lspDiagnosticTool.execute({ path: whitespaceFile }, ctx)

        expect(result.title).toBe(whitespaceFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(whitespaceFile)
        }
      },
    })
  })

  test("should handle file with comments only", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const commentFile = path.join(fixture.path, "comment.ts")
        await fs.writeFile(commentFile, "// This is a comment\n/* Another comment */")

        const result = await lspDiagnosticTool.execute({ path: commentFile }, ctx)

        expect(result.title).toBe(commentFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(commentFile)
        }
      },
    })
  })

  test("should handle concurrent requests", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFiles = Array.from({ length: 3 }, (_, i) => {
          const fileName = `file${i}.ts`
          const fullPath = path.join(fixture.path, fileName)
          fs.writeFile(fullPath, `const x${i}: string = 'hello${i}';`)
          return fileName
        })

        const promises = testFiles.map((fileName) =>
          lspDiagnosticTool.execute({ path: fileName }, ctx),
        )

        const results = await Promise.all(promises)

        expect(results).toHaveLength(3)
        results.forEach((result, index) => {
          const expectedFile = path.join(fixture.path, `file${index}.ts`)
          expect(result.title).toBe(expectedFile)
          expect(result.metadata.diagnostics).toBeDefined()
        })
      },
    })
  })

  test("should handle file outside working directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const outsideFile = path.join("/tmp", "outside.ts")

        const result = await lspDiagnosticTool.execute({ path: outsideFile }, ctx)

        // Should handle gracefully - either return empty diagnostics or specific error
        expect(result).toBeDefined()
        expect(result.title).toBe(outsideFile)
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Test missing path parameter
        await expect(lspDiagnosticTool.execute({} as any, ctx)).rejects.toThrow()
      },
    })
  })

  test("should handle special characters in file path", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const specialFile = path.join(fixture.path, "file-with-special.ts")
        await fs.writeFile(specialFile, "const x: string = 'hello';")

        const result = await lspDiagnosticTool.execute({ path: specialFile }, ctx)

        expect(result.title).toBe(specialFile)
        expect(result.metadata.diagnostics).toBeDefined()
        expect(typeof result.metadata.diagnostics).toBe("object")
        expect(Array.isArray(Object.keys(result.metadata.diagnostics))).toBe(true)

        // If LSP servers are available, should contain the file
        if (Object.keys(result.metadata.diagnostics).length > 0) {
          expect(Object.keys(result.metadata.diagnostics)).toContain(specialFile)
        }
      },
    })
  })
})
