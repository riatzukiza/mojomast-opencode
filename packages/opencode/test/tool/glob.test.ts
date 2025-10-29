import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { GlobTool } from "../../src/tool/glob"
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

const globTool = await GlobTool.init()

describe("tool.glob", () => {
  let fixture: Awaited<ReturnType<typeof tmpdir>> | undefined

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should match files with simple pattern", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create test files
        await fs.writeFile(path.join(fixture.path, "test.txt"), "content")
        await fs.writeFile(path.join(fixture.path, "test.js"), "content")
        await fs.writeFile(path.join(fixture.path, "other.txt"), "content")

        const result = await globTool.execute(
          {
            pattern: "*.txt",
          },
          ctx,
        )

        expect(result.output).toContain("test.txt")
        expect(result.output).toContain("other.txt")
        expect(result.output).not.toContain("test.js")
      },
    })
  })

  test("should match files with recursive pattern", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create nested structure
        await fs.mkdir(path.join(fixture.path, "src"))
        await fs.mkdir(path.join(fixture.path, "src", "components"))
        await fs.writeFile(path.join(fixture.path, "src", "app.ts"), "content")
        await fs.writeFile(path.join(fixture.path, "src", "components", "button.tsx"), "content")
        await fs.writeFile(path.join(fixture.path, "test.js"), "content")

        const result = await globTool.execute(
          {
            pattern: "**/*.{ts,tsx}",
          },
          ctx,
        )

        expect(result.output).toContain("app.ts")
        expect(result.output).toMatch(/button\.tsx/)
        expect(result.output).not.toContain("test.js")
      },
    })
  })

  test("should search in specific directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create nested structure
        await fs.mkdir(path.join(fixture.path, "src"))
        await fs.mkdir(path.join(fixture.path, "test"))
        await fs.writeFile(path.join(fixture.path, "src", "app.ts"), "content")
        await fs.writeFile(path.join(fixture.path, "test", "spec.ts"), "content")

        const result = await globTool.execute(
          {
            pattern: "*.ts",
            path: "src",
          },
          ctx,
        )

        expect(result.output).toContain("src/app.ts")
        expect(result.output).not.toContain("test/spec.ts")
      },
    })
  })

  test("should handle complex patterns", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create various file types
        await fs.writeFile(path.join(fixture.path, "app.ts"), "content")
        await fs.writeFile(path.join(fixture.path, "app.tsx"), "content")
        await fs.writeFile(path.join(fixture.path, "util.js"), "content")
        await fs.writeFile(path.join(fixture.path, "util.jsx"), "content")
        await fs.writeFile(path.join(fixture.path, "style.css"), "content")

        const result = await globTool.execute(
          {
            pattern: "*.{ts,tsx,js,jsx}",
          },
          ctx,
        )

        expect(result.output).toContain("app.ts")
        expect(result.output).toContain("app.tsx")
        expect(result.output).toContain("util.js")
        expect(result.output).toContain("util.jsx")
        expect(result.output).not.toContain("style.css")
      },
    })
  })

  test("should handle no matches", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "test.txt"), "content")

        const result = await globTool.execute(
          {
            pattern: "*.js",
          },
          ctx,
        )

        expect(result.output).toBeDefined()
        expect(typeof result.output).toBe("string")
      },
    })
  })

  test("should handle non-existent directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(
          globTool.execute(
            {
              pattern: "*.txt",
              path: "nonexistent",
            },
            ctx,
          ),
        ).rejects.toThrow()
      },
    })
  })

  test("should handle absolute paths", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "test.txt"), "content")

        const result = await globTool.execute(
          {
            pattern: "*.txt",
            path: fixture.path,
          },
          ctx,
        )

        expect(result.output).toContain("test.txt")
      },
    })
  })

  test("should limit results", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create many files
        for (let i = 0; i < 150; i++) {
          await fs.writeFile(path.join(fixture.path, `file${i}.txt`), `content${i}`)
        }

        const result = await globTool.execute(
          {
            pattern: "*.txt",
          },
          ctx,
        )

        // Should not crash and should return some results
        expect(result.output).toBeDefined()
        expect(typeof result.output).toBe("string")
        expect(result.output).toContain("file0.txt")
      },
    })
  })

  test("should handle hidden files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, ".env"), "environment")
        await fs.writeFile(path.join(fixture.path, "normal.txt"), "content")

        const result = await globTool.execute(
          {
            pattern: ".*",
          },
          ctx,
        )

        expect(result.output).toContain(".env")
        expect(result.output).not.toContain("normal.txt")
      },
    })
  })
})
