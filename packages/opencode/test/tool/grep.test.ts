import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { GrepTool } from "../../src/tool/grep"
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

const grepTool = await GrepTool.init()

describe("tool.grep", () => {
  let fixture: Awaited<ReturnType<typeof tmpdir>> | undefined

  beforeEach(async () => {
    fixture = await tmpdir()
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should search for pattern in files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create test files
        await fs.writeFile(path.join(fixture.path, "file1.txt"), "Hello World\nAnother line")
        await fs.writeFile(path.join(fixture.path, "file2.txt"), "No match here")
        await fs.writeFile(path.join(fixture.path, "file3.txt"), "World hello")

        const result = await grepTool.execute(
          {
            pattern: "Hello",
          },
          ctx,
        )

        expect(result.output).toContain("file1.txt")
        expect(result.output).toContain("Hello World")
        expect(result.output).not.toContain("file2.txt")
      },
    })
  })

  test("should search with include pattern", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create test files
        await fs.writeFile(path.join(fixture.path, "app.js"), "function test() { return 'test'; }")
        await fs.writeFile(path.join(fixture.path, "style.css"), ".test { color: red; }")
        await fs.writeFile(path.join(fixture.path, "script.ts"), "function test() { return 'test'; }")

        const result = await grepTool.execute(
          {
            pattern: "test",
            include: "*.js",
          },
          ctx,
        )

        expect(result.output).toContain("app.js")
        expect(result.output).not.toContain("style.css")
        expect(result.output).not.toContain("script.ts")
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
        await fs.writeFile(path.join(fixture.path, "src", "app.ts"), "function hello() {}")
        await fs.writeFile(path.join(fixture.path, "test", "spec.ts"), "function hello() {}")

        const srcPath = path.join(fixture.path, "src")
        const result = await grepTool.execute(
          {
            pattern: "hello",
            path: srcPath,
          },
          ctx,
        )

        expect(result.output).toContain("app.ts")
        expect(result.output).not.toContain("spec.ts")
      },
    })
  })

  test("should handle regex patterns", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "test.txt"), "function test123() {}\nfunction test456() {}")

        const result = await grepTool.execute(
          {
            pattern: "test\\d+",
          },
          ctx,
        )

        expect(result.output).toContain("test123")
        expect(result.output).toContain("test456")
      },
    })
  })

  test("should handle no matches", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "test.txt"), "No matching content here")

        const result = await grepTool.execute(
          {
            pattern: "nonexistent",
          },
          ctx,
        )

        expect(result.output).toBeDefined()
        expect(typeof result.output).toBe("string")
      },
    })
  })

  test("should handle multiple file types", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "app.ts"), "export function test() {}")
        await fs.writeFile(path.join(fixture.path, "component.tsx"), "function test() {}")
        await fs.writeFile(path.join(fixture.path, "style.css"), ".test {}")

        const result = await grepTool.execute(
          {
            pattern: "test",
            include: "*.{ts,tsx}",
          },
          ctx,
        )

        expect(result.output).toContain("app.ts")
        expect(result.output).toContain("component.tsx")
        expect(result.output).not.toContain("style.css")
      },
    })
  })

  test("should handle case sensitive search", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "test.txt"), "Hello hello HELLO")

        const result = await grepTool.execute(
          {
            pattern: "Hello",
          },
          ctx,
        )

        expect(result.output).toContain("Hello")
        // Should not match lowercase hello unless pattern is case insensitive
      },
    })
  })

  test("should handle special regex characters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await fs.writeFile(path.join(fixture.path, "test.txt"), "file.js\nfile.ts\nfile.txt")

        const result = await grepTool.execute(
          {
            pattern: "\\.js$",
          },
          ctx,
        )

        expect(result.output).toContain("file.js")
        expect(result.output).not.toContain("file.ts")
        expect(result.output).not.toContain("file.txt")
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(grepTool.execute({} as any, ctx)).rejects.toThrow("pattern is required")
      },
    })
  })

  test("should handle non-existent directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(
          grepTool.execute(
            {
              pattern: "test",
              path: "nonexistent",
            },
            ctx,
          ),
        ).rejects.toThrow()
      },
    })
  })

  test("should handle empty pattern", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(
          grepTool.execute(
            {
              pattern: "",
            },
            ctx,
          ),
        ).rejects.toThrow("pattern is required")
      },
    })
  })
})
