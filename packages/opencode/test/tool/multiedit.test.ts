import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { MultiEditTool } from "../../src/tool/multiedit"
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

const multiEditTool = await MultiEditTool.init()

describe("tool.multiedit", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should perform multiple edits sequentially", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "Hello World\nGoodbye World\nHello Universe")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await multiEditTool.execute(
          {
            filePath: testFile,
            edits: [
              {
                filePath: testFile,
                oldString: "Hello World",
                newString: "Hi Planet",
              },
              {
                filePath: testFile,
                oldString: "Goodbye World",
                newString: "Goodbye Planet",
              },
            ],
          },
          ctx,
        )

        expect(result.title).toMatch(/test\.txt$/)

        // Check final content
        const finalContent = await fs.readFile(testFile, "utf-8")
        expect(finalContent).toContain("Hi Planet")
        expect(finalContent).toContain("Goodbye Planet")
        expect(finalContent).toContain("Hello Universe")
        expect(finalContent).not.toContain("Hello World")
        expect(finalContent).not.toContain("Goodbye World")
      },
    })
  })

  test("should handle replaceAll in edits", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "test test test")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await multiEditTool.execute(
          {
            filePath: testFile,
            edits: [
              {
                filePath: testFile,
                oldString: "test",
                newString: "done",
                replaceAll: true,
              },
            ],
          },
          ctx,
        )

        const finalContent = await fs.readFile(testFile, "utf-8")
        expect(finalContent).toBe("done done done")
      },
    })
  })

  test("should handle empty edits array", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "Original content")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await multiEditTool.execute(
          {
            filePath: testFile,
            edits: [],
          },
          ctx,
        )

        expect(result.title).toMatch(/test\.txt$/)
        // When no edits, output might be undefined or empty
        expect(result.output).toBe("")
        const finalContent = await fs.readFile(testFile, "utf-8")
        expect(finalContent).toBe("Original content")
      },
    })
  })

  test("should handle edits that don't match", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "Original content")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        // This test will fail because edit tool throws when oldString not found
        await expect(
          multiEditTool.execute(
            {
              filePath: testFile,
              edits: [
                {
                  filePath: testFile,
                  oldString: "nonexistent",
                  newString: "replacement",
                },
              ],
            },
            ctx,
          ),
        ).rejects.toThrow("oldString not found in content")
      },
    })
  })

  test("should handle file creation with multiedit", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const newFile = path.join(fixture.path, "new.txt")

        const result = await multiEditTool.execute(
          {
            filePath: newFile,
            edits: [
              {
                filePath: newFile,
                oldString: "",
                newString: "First line\nSecond line",
              },
            ],
          },
          ctx,
        )

        const finalContent = await fs.readFile(newFile, "utf-8")
        expect(finalContent).toBe("First line\nSecond line")
      },
    })
  })

  test("should handle complex multiedit operations", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "complex.txt")
        await fs.writeFile(testFile, "function oldName() {\n  return 'old';\n}\n// TODO: update")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await multiEditTool.execute(
          {
            filePath: testFile,
            edits: [
              {
                filePath: testFile,
                oldString: "oldName",
                newString: "newName",
              },
              {
                filePath: testFile,
                oldString: "'old'",
                newString: "'new'",
              },
              {
                filePath: testFile,
                oldString: "// TODO: update",
                newString: "// Updated function",
              },
            ],
          },
          ctx,
        )

        const finalContent = await fs.readFile(testFile, "utf-8")
        expect(finalContent).toContain("function newName()")
        expect(finalContent).toContain("return 'new'")
        expect(finalContent).toContain("// Updated function")
        expect(finalContent).not.toContain("oldName")
        expect(finalContent).not.toContain("'old'")
        expect(finalContent).not.toContain("// TODO: update")
      },
    })
  })

  test("should handle special characters in edits", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "special.txt")
        await fs.writeFile(testFile, "Hello wörld 🌍")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await multiEditTool.execute(
          {
            filePath: testFile,
            edits: [
              {
                filePath: testFile,
                oldString: "wörld 🌍",
                newString: "universe 🚀",
              },
            ],
          },
          ctx,
        )

        const finalContent = await fs.readFile(testFile, "utf-8")
        expect(finalContent).toBe("Hello universe 🚀")
      },
    })
  })

  test("should handle large number of edits", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "many.txt")
        let content = ""
        for (let i = 0; i < 50; i++) {
          content += `line${i}\n`
        }
        await fs.writeFile(testFile, content)

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        // Create edits to replace each line number with more context
        const edits = []
        for (let i = 0; i < 10; i++) {
          edits.push({
            filePath: testFile,
            oldString: `line${i}\n`,
            newString: `replaced${i}\n`,
          })
        }

        const result = await multiEditTool.execute(
          {
            filePath: testFile,
            edits,
          },
          ctx,
        )

        const finalContent = await fs.readFile(testFile, "utf-8")
        expect(finalContent).toContain("replaced0")
        expect(finalContent).toContain("replaced9")
        expect(finalContent).not.toContain("line0")
        expect(finalContent).not.toContain("line9")
        // Should still contain other lines
        expect(finalContent).toContain("line10")
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(multiEditTool.execute({} as any, ctx)).rejects.toThrow()

        await expect(
          multiEditTool.execute(
            {
              filePath: "test.txt",
              // missing edits
            } as any,
            ctx,
          ),
        ).rejects.toThrow()
      },
    })
  })

  test("should handle file outside working directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const outsideFile = path.join("/tmp", "outside.txt")

        await expect(
          multiEditTool.execute(
            {
              filePath: outsideFile,
              edits: [
                {
                  filePath: outsideFile,
                  oldString: "test",
                  newString: "done",
                },
              ],
            },
            ctx,
          ),
        ).rejects.toThrow("is not in the current working directory")
      },
    })
  })

  test("should handle identical oldString and newString", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "hello world")

        // Read the file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        await expect(
          multiEditTool.execute(
            {
              filePath: testFile,
              edits: [
                {
                  filePath: testFile,
                  oldString: "hello",
                  newString: "hello", // identical
                },
              ],
            },
            ctx,
          ),
        ).rejects.toThrow("oldString and newString must be different")
      },
    })
  })
})
