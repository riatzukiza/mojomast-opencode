import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { EditTool } from "../../src/tool/edit"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import * as fs from "fs/promises"
import { FileTime } from "../../src/file/time"

const ctx = {
  sessionID: "test",
  messageID: "",
  toolCallID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  metadata: () => {},
}

const editTool = await EditTool.init()

describe("tool.edit diagnostics integration", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should show diagnostics for file with errors after edit", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")

        // Create initial file with error
        await fs.writeFile(testFile, "const x: string = 123;")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "123",
            newString: "'hello'",
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics in output if errors exist
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
          expect(typeof result.output).toBe("string")
        }
      },
    })
  })

  test("should not show diagnostics for clean file after edit", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "clean.ts")

        // Create clean file
        await fs.writeFile(testFile, "const x: string = 'hello';")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "'hello'",
            newString: "'world'",
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should not show error diagnostics for clean file
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle edit that introduces errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "introduce-error.ts")

        // Create clean file
        await fs.writeFile(testFile, "const x: string = 'hello';")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "'hello'",
            newString: "123", // This will cause a type error
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics after introducing error
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle edit that fixes errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "fix-error.ts")

        // Create file with error
        await fs.writeFile(testFile, "const x: string = 123;")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "123",
            newString: "'fixed'", // This will fix the type error
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle multiple errors in file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "multiple-errors.ts")

        // Create file with multiple errors
        await fs.writeFile(
          testFile,
          `
          const x: string = 123;
          const y: number = "hello";
          const z: boolean = "true";
        `,
        )

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "123",
            newString: "'string'",
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics for remaining errors
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle file creation with edit", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const newFile = path.join(fixture.path, "new.ts")

        const result = await editTool.execute(
          {
            filePath: newFile,
            oldString: "",
            newString: "const x: string = 'hello';",
          },
          ctx,
        )

        expect(result.title).toBe(newFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should not show errors for clean new file
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle file creation with errors", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const errorFile = path.join(fixture.path, "error-new.ts")

        const result = await editTool.execute(
          {
            filePath: errorFile,
            oldString: "",
            newString: "const x: string = 123;", // Type error
          },
          ctx,
        )

        expect(result.title).toBe(errorFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics for new file with errors
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle large file edits", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const largeFile = path.join(fixture.path, "large.ts")

        // Create large file
        let content = "const x: string = 'hello';\n"
        for (let i = 0; i < 100; i++) {
          content += `const line${i}: string = 'line ${i}';\n`
        }
        await fs.writeFile(largeFile, content)

        // Read the file first to satisfy FileTime.assert
        await Bun.file(largeFile).text()
        FileTime.read(ctx.sessionID, largeFile)

        const result = await editTool.execute(
          {
            filePath: largeFile,
            oldString: "'hello'",
            newString: "'world'",
          },
          ctx,
        )

        expect(result.title).toBe(largeFile)
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle edit with special characters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const specialFile = path.join(fixture.path, "special.ts")

        await fs.writeFile(specialFile, 'const x: string = "hello world";')

        // Read the file first to satisfy FileTime.assert
        await Bun.file(specialFile).text()
        FileTime.read(ctx.sessionID, specialFile)

        const result = await editTool.execute(
          {
            filePath: specialFile,
            oldString: '"hello world"',
            newString: '"héllo wörld 🌍"',
          },
          ctx,
        )

        expect(result.title).toBe(specialFile)
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle edit that removes content", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "remove.ts")

        await fs.writeFile(testFile, "const x: string = 'hello'; const y: string = 'world';")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: " const y: string = 'world';",
            newString: "",
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()
      },
    })
  })

  test("should handle edit with replaceAll", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "replace-all.ts")

        await fs.writeFile(testFile, "const x = 'hello'; const y = 'hello'; const z = 'hello';")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "'hello'",
            newString: "'world'",
            replaceAll: true,
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Verify the file was actually changed
        const updatedContent = await fs.readFile(testFile, "utf-8")
        expect(updatedContent).toContain("'world'")
        expect(updatedContent).not.toContain("'hello'")
      },
    })
  })

  test("should handle concurrent edits", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "concurrent.ts")

        await fs.writeFile(testFile, "const x: string = 'hello';")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        // Execute multiple edits concurrently
        const promises = [
          editTool.execute(
            {
              filePath: testFile,
              oldString: "'hello'",
              newString: "'world'",
            },
            ctx,
          ),
          editTool.execute(
            {
              filePath: testFile,
              oldString: "x",
              newString: "y",
            },
            ctx,
          ),
        ]

        const results = await Promise.allSettled(promises)

        // At least one should succeed
        expect(results.some((r) => r.status === "fulfilled")).toBe(true)
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")

        // Test missing filePath
        await expect(
          editTool.execute({ oldString: "a", newString: "b" } as any, ctx),
        ).rejects.toThrow("filePath is required")

        // Test missing oldString
        await expect(
          editTool.execute({ filePath: testFile, newString: "b" } as any, ctx),
        ).rejects.toThrow("File")

        // Test missing newString
        await expect(
          editTool.execute({ filePath: testFile, oldString: "a" } as any, ctx),
        ).rejects.toThrow("File")
      },
    })
  })

  test("should handle identical oldString and newString", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.ts")

        await expect(
          editTool.execute(
            {
              filePath: testFile,
              oldString: "hello",
              newString: "hello",
            },
            ctx,
          ),
        ).rejects.toThrow("oldString and newString must be different")
      },
    })
  })
})
