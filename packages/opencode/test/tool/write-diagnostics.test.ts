import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { WriteTool } from "../../src/tool/write"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import * as fs from "fs/promises"
import { FileTime } from "../../src/file/time"

const ctx = {
  sessionID: "test",
  messageID: "",
  callID: "",
  agent: "build",
  abort: new AbortController().signal,
  metadata: () => {},
}

const writeTool = await WriteTool.init()

describe("tool.write diagnostics integration", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should show diagnostics for new file with errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const errorFile = path.join(fixture.path, "error.ts")

        const result = await writeTool.execute(
          {
            filePath: errorFile,
            content: "const x: string = 123; // Type error",
          },
          ctx,
        )

        expect(result.title).toBe("error.ts")
        expect(result.metadata.diagnostics).toBeDefined()
        expect(result.metadata.exists).toBe(false)

        // Should show diagnostics for file with errors
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should not show diagnostics for clean new file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const cleanFile = path.join(fixture.path, "clean.ts")

        const result = await writeTool.execute(
          {
            filePath: cleanFile,
            content: "const x: string = 'hello';",
          },
          ctx,
        )

        expect(result.title).toBe("clean.ts")
        expect(result.metadata.diagnostics).toBeDefined()
        expect(result.metadata.exists).toBe(false)

        // Should not show error diagnostics for clean file
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }
      },
    })
  })

  test("should show diagnostics for overwritten file with errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "overwrite.ts")

        // Create initial clean file
        await fs.writeFile(testFile, "const x: string = 'hello';")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await writeTool.execute(
          {
            filePath: testFile,
            content: "const x: string = 123; // Type error",
          },
          ctx,
        )

        expect(result.title).toBe("overwrite.ts")
        expect(result.metadata.diagnostics).toBeDefined()
        expect(result.metadata.exists).toBe(true)

        // Should show diagnostics after overwriting with error
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should show project diagnostics for other affected files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const mainFile = path.join(fixture.path, "main.ts")
        const utilFile = path.join(fixture.path, "util.ts")

        // Create files with dependencies
        await fs.writeFile(
          mainFile,
          `
          import { helper } from './util';
          console.log(helper);
        `,
        )

        await fs.writeFile(utilFile, "export const helper: string = 123;")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(utilFile).text()
        FileTime.read(ctx.sessionID, utilFile)

        const result = await writeTool.execute(
          {
            filePath: utilFile,
            content: "export const helper: string = 'fixed';",
          },
          ctx,
        )

        await fs.writeFile(utilFile, "export const helper: string = 123;")

        // Read the file again to satisfy FileTime.assert after direct write
        await Bun.file(utilFile).text()
        FileTime.read(ctx.sessionID, utilFile)

        const result2 = await writeTool.execute(
          {
            filePath: utilFile,
            content: "export const helper: string = 'fixed';",
          },
          ctx,
        )

        expect(result2.title).toBe("util.ts")
        expect(result2.metadata.diagnostics).toBeDefined()
        expect(result2.metadata.exists).toBe(true)

        // Should show project diagnostics if other files are affected
        if (result2.output) {
          expect(typeof result2.output).toBe("string")
        }
      },
    })
  })

  test("should handle file with multiple errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const multiErrorFile = path.join(fixture.path, "multi-error.ts")

        const result = await writeTool.execute(
          {
            filePath: multiErrorFile,
            content: `
              const x: string = 123;
              const y: number = "hello";
              const z: boolean = "true";
              const unused: string = "not used";
            `,
          },
          ctx,
        )

        expect(result.title).toBe("multi-error.ts")
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics for multiple errors
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle empty file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const emptyFile = path.join(fixture.path, "empty.ts")

        const result = await writeTool.execute(
          {
            filePath: emptyFile,
            content: "",
          },
          ctx,
        )

        expect(result.title).toBe("empty.ts")
        expect(result.metadata.diagnostics).toBeDefined()
        expect(result.metadata.exists).toBe(false)

        // Empty file should not have error diagnostics
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle file with only comments", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const commentFile = path.join(fixture.path, "comment.ts")

        const result = await writeTool.execute(
          {
            filePath: commentFile,
            content: `
              // This is a comment
              /* Multi-line comment */
              /** JSDoc comment */
            `,
          },
          ctx,
        )

        expect(result.title).toBe("comment.ts")
        expect(result.metadata.diagnostics).toBeDefined()

        // Comments only should not have error diagnostics
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle large file content", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const largeFile = path.join(fixture.path, "large.ts")

        // Generate large content
        let content = "const x: string = 'hello';\n"
        for (let i = 0; i < 1000; i++) {
          content += `const line${i}: string = 'line ${i}';\n`
        }

        const result = await writeTool.execute(
          {
            filePath: largeFile,
            content,
          },
          ctx,
        )

        expect(result.title).toBe("large.ts")
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle special characters in content", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const specialFile = path.join(fixture.path, "special.ts")

        const result = await writeTool.execute(
          {
            filePath: specialFile,
            content: 'const x: string = "héllo wörld 🌍 \\n\\t";',
          },
          ctx,
        )

        expect(result.title).toBe("special.ts")
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle Unicode content", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const unicodeFile = path.join(fixture.path, "unicode.ts")

        const result = await writeTool.execute(
          {
            filePath: unicodeFile,
            content: `
              const chinese: string = "你好世界";
              const arabic: string = "مرحبا بالعالم";
              const emoji: string = "🚀🌟💻";
            `,
          },
          ctx,
        )

        expect(result.title).toBe("unicode.ts")
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle JSON file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const jsonFile = path.join(fixture.path, "config.json")

        const result = await writeTool.execute(
          {
            filePath: jsonFile,
            content: JSON.stringify(
              {
                name: "test",
                version: "1.0.0",
                invalid: undefined, // This might cause issues in some JSON parsers
              },
              null,
              2,
            ),
          },
          ctx,
        )

        expect(result.title).toBe("config.json")
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle concurrent writes to different files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const files = []

        // Create multiple files concurrently
        for (let i = 0; i < 3; i++) {
          const file = path.join(fixture.path, `concurrent${i}.ts`)
          files.push(file)
        }

        const promises = files.map((file, index) =>
          writeTool.execute(
            {
              filePath: file,
              content: `const x${index}: string = 'hello${index}';`,
            },
            ctx,
          ),
        )

        const results = await Promise.all(promises)

        expect(results).toHaveLength(3)
        results.forEach((result, index) => {
          expect(result.title).toBe(`concurrent${index}.ts`)
          expect(result.metadata.diagnostics).toBeDefined()
          expect(result.metadata.exists).toBe(false)
        })
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Test missing filePath
        await expect(writeTool.execute({ content: "test" } as any, ctx)).rejects.toThrow(
          'The "path" property must be of type string',
        )

        // Test missing content
        await expect(writeTool.execute({ filePath: "test.ts" } as any, ctx)).rejects.toThrow()
      },
    })
  })

  test("should handle relative paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const result = await writeTool.execute(
          {
            filePath: "relative.ts",
            content: "const x: string = 'hello';",
          },
          ctx,
        )

        expect(result.title).toBe("relative.ts")
        expect(result.metadata.diagnostics).toBeDefined()

        // Verify file was created
        const createdFile = path.join(fixture.path, "relative.ts")
        const exists = await fs
          .access(createdFile)
          .then(() => true)
          .catch(() => false)
        expect(exists).toBe(true)
      },
    })
  })

  test("should handle absolute paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const absoluteFile = path.join(fixture.path, "absolute.ts")

        const result = await writeTool.execute(
          {
            filePath: absoluteFile,
            content: "const x: string = 'hello';",
          },
          ctx,
        )

        expect(result.title).toBe("absolute.ts")
        expect(result.metadata.diagnostics).toBeDefined()

        // Verify file was created
        const exists = await fs
          .access(absoluteFile)
          .then(() => true)
          .catch(() => false)
        expect(exists).toBe(true)
      },
    })
  })

  test("should handle file outside working directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const outsideFile = path.join("/tmp", "outside.ts")

        // Should throw error for files outside working directory
        await expect(
          writeTool.execute(
            {
              filePath: outsideFile,
              content: "const x: string = 'hello';",
            },
            ctx,
          ),
        ).rejects.toThrow("is not in the current working directory")
      },
    })
  })
})
