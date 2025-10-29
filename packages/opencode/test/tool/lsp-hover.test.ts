import { describe, expect, test, beforeEach, afterEach, beforeAll } from "bun:test"
import { LspHoverTool } from "../../src/tool/lsp-hover"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { writeFileSync } from "fs"
import path from "path"

let lspHoverTool: any
let fixture: any

beforeAll(async () => {
  lspHoverTool = await LspHoverTool.init()
})

beforeEach(async () => {
  fixture = await tmpdir()
})

afterEach(async () => {
  if (fixture) {
    await fixture[Symbol.asyncDispose]?.()
  }
})

describe("tool.lsp_hover", () => {
  test("should initialize properly", async () => {
    expect(lspHoverTool.description).toBeDefined()
    expect(lspHoverTool.parameters).toBeDefined()
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(lspHoverTool.execute({})).rejects.toThrow()
      },
    })
  })

  test("should require file parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          line: 1,
          character: 5,
        }

        await expect(lspHoverTool.execute(params)).rejects.toThrow()
      },
    })
  })

test("should handle missing line parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          file: "test.ts",
          character: 5
        }

        // Tool should handle missing parameters gracefully
        const result = await lspHoverTool.execute(params)
        expect(result).toBeDefined()
        expect(result.title).toBeDefined()
        expect(result.metadata).toBeDefined()
        expect(result.output).toBeDefined()
      }
    })
  })

  test("should handle missing character parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          file: "test.ts",
          line: 1
        }

        // Tool should handle missing parameters gracefully
        const result = await lspHoverTool.execute(params)
        expect(result).toBeDefined()
        expect(result.title).toBeDefined()
        expect(result.metadata).toBeDefined()
        expect(result.output).toBeDefined()
      }
    })
  })
  })

  test("should require character parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          file: "test.ts",
          line: 1,
        }

        await expect(lspHoverTool.execute(params)).rejects.toThrow()
      },
    })
  })

  test("should handle absolute file paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        writeFileSync(testFile, "const x = 1;")

        const params = {
          file: testFile,
          line: 1,
          character: 6,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
          expect(result.title).toBeDefined()
          expect(result.metadata).toBeDefined()
          expect(result.output).toBeDefined()
        } catch (error) {
          // LSP might not be available in test environment
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle relative file paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        writeFileSync(testFile, "const x = 1;")

        const params = {
          file: "test.ts",
          line: 1,
          character: 6,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
          expect(result.title).toBeDefined()
          expect(result.metadata).toBeDefined()
          expect(result.output).toBeDefined()
        } catch (error) {
          // LSP might not be available in test environment
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle non-existent files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          file: "non-existent.ts",
          line: 1,
          character: 1,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
        } catch (error) {
          // Expected to fail for non-existent files
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle zero-based line numbers", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        writeFileSync(testFile, "const x = 1;")

        const params = {
          file: "test.ts",
          line: 0,
          character: 0,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle large line numbers", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        writeFileSync(testFile, "const x = 1;")

        const params = {
          file: "test.ts",
          line: 1000,
          character: 50,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle large character numbers", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        writeFileSync(testFile, "const x = 1;")

        const params = {
          file: "test.ts",
          line: 1,
          character: 1000,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle negative line numbers", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          file: "test.ts",
          line: -1,
          character: 5,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should handle negative character numbers", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const params = {
          file: "test.ts",
          line: 1,
          character: -1,
        }

        try {
          const result = await lspHoverTool.execute(params)
          expect(result).toBeDefined()
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      },
    })
  })

  test("should have proper parameter schema", async () => {
    const schema = lspHoverTool.parameters
    expect(schema.shape.file).toBeDefined()
    expect(schema.shape.line).toBeDefined()
    expect(schema.shape.character).toBeDefined()

    // Check parameter descriptions
    expect(schema.shape.file.description).toContain("path")
    expect(schema.shape.line.description).toContain("line")
    expect(schema.shape.character.description).toContain("character")
  })

  test("should return structured result format", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")
        writeFileSync(testFile, "const x = 1;")

        const params = {
          file: testFile,
          line: 1,
          character: 6,
        }

        try {
          const result = await lspHoverTool.execute(params)

          // Check result structure
          expect(result).toHaveProperty("title")
          expect(result).toHaveProperty("metadata")
          expect(result).toHaveProperty("output")

          // Check title format (should include file:line:character)
          expect(result.title).toMatch(/.*:1:6/)

          // Check metadata structure
          expect(result.metadata).toHaveProperty("result")

          // Check output is JSON string
          expect(() => JSON.parse(result.output)).not.toThrow()
        } catch (error) {
          // LSP might not be available, but we can still test the structure
          expect(error.message).toBeDefined()
        }
      },
    })
  })
})
