import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { ReadTool } from "../../src/tool/read"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import * as fs from "fs/promises"

const ctx = {
  sessionID: "test",
  messageID: "",
  callID: "",
  agent: "build",
  abort: new AbortController().signal,
  metadata: () => {},
}

const readTool = await ReadTool.init()

describe("tool.read", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should read file content", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "Hello World\nLine 2\nLine 3")

        const result = await readTool.execute(
          {
            filePath: testFile,
          },
          ctx,
        )

        expect(result.title).toMatch(/test\.txt$/)
        expect(result.output).toContain("Hello World")
        expect(result.output).toContain("Line 2")
        expect(result.output).toContain("Line 3")
      },
    })
  })

  test("should read file with offset and limit", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const testFile = path.join(fixture.path, "test.txt")
        await fs.writeFile(testFile, "Line 1\nLine 2\nLine 3\nLine 4\nLine 5")

        const result = await readTool.execute(
          {
            filePath: testFile,
            offset: 1,
            limit: 2,
          },
          ctx,
        )

        expect(result.title).toMatch(/test\.txt$/)
        expect(result.output).toContain("Line 2")
        expect(result.output).toContain("Line 3")
        expect(result.output).not.toContain("Line 1")
        expect(result.output).not.toContain("Line 4")
      },
    })
  })

  test("should handle non-existent file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const nonExistentFile = path.join(fixture.path, "nonexistent.txt")

        await expect(
          readTool.execute(
            {
              filePath: nonExistentFile,
            },
            ctx,
          ),
        ).rejects.toThrow("File not found")
      },
    })
  })

  test("should handle file outside working directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const outsideFile = path.join("/tmp", "outside.txt")

        await expect(
          readTool.execute(
            {
              filePath: outsideFile,
            },
            ctx,
          ),
        ).rejects.toThrow("is not in the current working directory")
      },
    })
  })

  test("should handle empty file", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const emptyFile = path.join(fixture.path, "empty.txt")
        await fs.writeFile(emptyFile, "")

        const result = await readTool.execute(
          {
            filePath: emptyFile,
          },
          ctx,
        )

        expect(result.title).toMatch(/empty\.txt$/)
        expect(result.output).toMatch(/^(<file>\s*00001\|\s*\s*<\/file>\s*)?$/)
      },
    })
  })

  test("should handle large files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const largeFile = path.join(fixture.path, "large.txt")
        let content = ""
        for (let i = 0; i < 100; i++) {
          content += `Line ${i}\n`
        }
        await fs.writeFile(largeFile, content)

        const result = await readTool.execute(
          {
            filePath: largeFile,
            limit: 10,
          },
          ctx,
        )

        expect(result.title).toMatch(/large\.txt$/)
        expect(result.output).toContain("Line 0")
        expect(result.output).toContain("Line 9")
        expect(result.output).not.toContain("Line 10")
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(readTool.execute({} as any, ctx)).rejects.toThrow()
      },
    })
  })
})
