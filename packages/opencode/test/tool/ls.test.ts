import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { ListTool } from "../../src/tool/ls"
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

const lsTool = await ListTool.init()

describe("tool.list", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should list files and directories", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create some test files and directories
        await fs.writeFile(path.join(fixture.path, "file1.txt"), "content1")
        await fs.writeFile(path.join(fixture.path, "file2.txt"), "content2")
        await fs.mkdir(path.join(fixture.path, "subdir"))
        await fs.writeFile(path.join(fixture.path, "subdir", "nested.txt"), "nested")

        const result = await lsTool.execute({}, ctx)

        expect(result.output).toContain("file1.txt")
        expect(result.output).toContain("file2.txt")
        expect(result.output).toContain("subdir")
      },
    })
  })

  test("should list files in subdirectory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create subdirectory with files
        const subdir = path.join(fixture.path, "subdir")
        await fs.mkdir(subdir)
        await fs.writeFile(path.join(subdir, "nested1.txt"), "content1")
        await fs.writeFile(path.join(subdir, "nested2.txt"), "content2")

        const result = await lsTool.execute(
          {
            path: subdir,
          },
          ctx,
        )

        expect(result.output).toContain("nested1.txt")
        expect(result.output).toContain("nested2.txt")
        expect(result.output).not.toContain("file1.txt")
      },
    })
  })

  test("should handle empty directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const result = await lsTool.execute({}, ctx)

        expect(result.output).toBeDefined()
        expect(typeof result.output).toBe("string")
      },
    })
  })

  test("should handle non-existent directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const nonExistentDir = path.join(fixture.path, "nonexistent")

        await expect(
          lsTool.execute(
            {
              path: nonExistentDir,
            },
            ctx,
          ),
        ).rejects.toThrow()
      },
    })
  })

  test("should ignore common patterns", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create files that should be ignored
        await fs.mkdir(path.join(fixture.path, ".git"))
        await fs.writeFile(path.join(fixture.path, ".git", "config"), "git config")
        await fs.mkdir(path.join(fixture.path, "node_modules"))
        await fs.writeFile(path.join(fixture.path, "node_modules", "package.json"), "{}")
        await fs.mkdir(path.join(fixture.path, "dist"))
        await fs.writeFile(path.join(fixture.path, "dist", "bundle.js"), "bundle")

        // Create files that should not be ignored
        await fs.writeFile(path.join(fixture.path, "src.ts"), "source code")
        await fs.writeFile(path.join(fixture.path, "README.md"), "readme")

        const result = await lsTool.execute({}, ctx)

        expect(result.output).toContain("src.ts")
        expect(result.output).toContain("README.md")
        expect(result.output).not.toContain(".git")
        expect(result.output).not.toContain("node_modules")
        expect(result.output).not.toContain("dist")
      },
    })
  })

  test("should handle relative paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create subdirectory
        await fs.mkdir(path.join(fixture.path, "subdir"))
        await fs.writeFile(path.join(fixture.path, "subdir", "test.txt"), "content")

        const result = await lsTool.execute(
          {
            path: "subdir",
          },
          ctx,
        )

        expect(result.output).toContain("test.txt")
      },
    })
  })

  test("should handle absolute paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const subdir = path.join(fixture.path, "subdir")
        await fs.mkdir(subdir)
        await fs.writeFile(path.join(subdir, "test.txt"), "content")

        const result = await lsTool.execute(
          {
            path: subdir,
          },
          ctx,
        )

        expect(result.output).toContain("test.txt")
      },
    })
  })

  test("should handle directory with many files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create many files
        for (let i = 0; i < 50; i++) {
          await fs.writeFile(path.join(fixture.path, `file${i}.txt`), `content${i}`)
        }

        const result = await lsTool.execute({}, ctx)

        expect(result.output).toContain("file0.txt")
        expect(result.output).toContain("file49.txt")
      },
    })
  })

  test("should handle special characters in filenames", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "file with spaces.txt"), "content")
        await fs.writeFile(path.join(fixture.path, "file-with-dashes.txt"), "content")
        await fs.writeFile(path.join(fixture.path, "file_with_underscores.txt"), "content")

        const result = await lsTool.execute({}, ctx)

        expect(result.output).toContain("file with spaces.txt")
        expect(result.output).toContain("file-with-dashes.txt")
        expect(result.output).toContain("file_with_underscores.txt")
      },
    })
  })
})
