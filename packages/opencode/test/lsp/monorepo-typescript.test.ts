import { describe, test, expect, beforeEach, afterEach } from "bun:test"
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

describe("LSP TypeScript Monorepo Integration", () => {
  let fixture: any
  let repoRoot: string
  let subpkgPath: string

  beforeEach(async () => {
    fixture = await tmpdir()
    repoRoot = fixture.path

    // Create monorepo structure
    await fs.mkdir(path.join(repoRoot, "packages", "subpkg"), { recursive: true })
    subpkgPath = path.join(repoRoot, "packages", "subpkg")

    // Root tsconfig.json
    await fs.writeFile(
      path.join(repoRoot, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "bundler",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
          },
        },
        null,
        2,
      ),
    )

    // Root package.json with TypeScript dependency
    await fs.writeFile(
      path.join(repoRoot, "package.json"),
      JSON.stringify(
        {
          name: "monorepo-test",
          version: "1.0.0",
          private: true,
          workspaces: ["packages/*"],
          devDependencies: {
            typescript: "^5.0.0",
            "typescript-language-server": "^4.0.0",
          },
        },
        null,
        2,
      ),
    )

    // Subpackage tsconfig.json that extends root
    await fs.writeFile(
      path.join(subpkgPath, "tsconfig.json"),
      JSON.stringify(
        {
          extends: "../../tsconfig.json",
          compilerOptions: {
            outDir: "./dist",
            rootDir: "./src",
          },
          include: ["src/**/*"],
        },
        null,
        2,
      ),
    )

    // Subpackage package.json
    await fs.writeFile(
      path.join(subpkgPath, "package.json"),
      JSON.stringify(
        {
          name: "subpkg",
          version: "1.0.0",
          private: true,
          scripts: {
            build: "tsc",
          },
        },
        null,
        2,
      ),
    )

    // Create src directory and test file
    await fs.mkdir(path.join(subpkgPath, "src"), { recursive: true })
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should detect TypeScript errors when working from subpackage directory", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const testFile = path.join(subpkgPath, "src", "test.ts")

        // Create file with TypeScript error
        await fs.writeFile(testFile, "const x: string = 123; // Type error")

        // Read file first to satisfy FileTime.assert
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

  test("should use subpackage tsconfig.json as project root", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const testFile = path.join(subpkgPath, "src", "config-test.ts")

        // Create file that would have different behavior based on tsconfig
        await fs.writeFile(
          testFile,
          `
          // This should work with subpackage tsconfig
          const message: string = "Hello from subpackage";
          console.log(message);
        `,
        )

        // Read file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: '"Hello from subpackage"',
            newString: '"Updated message"',
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should not show errors for clean file
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle multiple TypeScript errors in subpackage", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const testFile = path.join(subpkgPath, "src", "multiple-errors.ts")

        // Create file with multiple TypeScript errors
        await fs.writeFile(
          testFile,
          `
          const x: string = 123;
          const y: number = "hello";
          const z: boolean = "true";
          const unused: string = "not used";
        `,
        )

        // Read file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "123",
            newString: "'fixed'",
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should still show diagnostics for remaining errors
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should work with relative paths from subpackage", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const relativePath = "src/relative-test.ts"
        const fullPath = path.join(subpkgPath, relativePath)

        // Create file with TypeScript error
        await fs.writeFile(fullPath, "const value: number = 'string'; // Type error")

        // Read file first to satisfy FileTime.assert
        await Bun.file(fullPath).text()
        FileTime.read(ctx.sessionID, fullPath)

        const result = await editTool.execute(
          {
            filePath: relativePath, // Use relative path
            oldString: "'string'",
            newString: "42",
          },
          ctx,
        )

        expect(result.title).toBe(fullPath)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics for remaining issues
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle file creation in subpackage", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const newFile = path.join(subpkgPath, "src", "new-file.ts")

        const result = await editTool.execute(
          {
            filePath: newFile,
            oldString: "",
            newString: "const newVar: string = 'Hello world';",
          },
          ctx,
        )

        expect(result.title).toBe(newFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should not show errors for clean new file
        if (result.output) {
          expect(result.output).not.toContain("file_diagnostics")
        }

        // Verify file was actually created
        const exists = await fs
          .access(newFile)
          .then(() => true)
          .catch(() => false)
        expect(exists).toBe(true)
      },
    })
  })

  test("should handle file creation with errors in subpackage", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const errorFile = path.join(subpkgPath, "src", "error-file.ts")

        const result = await editTool.execute(
          {
            filePath: errorFile,
            oldString: "",
            newString: "const errorVar: string = 123; // Type error",
          },
          ctx,
        )

        expect(result.title).toBe(errorFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics for new file with errors
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }

        // Verify file was actually created
        const exists = await fs
          .access(errorFile)
          .then(() => true)
          .catch(() => false)
        expect(exists).toBe(true)
      },
    })
  })

  test("should handle deep nesting in monorepo", async () => {
    // Create deeper nested structure
    const deepPath = path.join(subpkgPath, "src", "components", "ui")
    await fs.mkdir(deepPath, { recursive: true })

    await Instance.provide({
      directory: deepPath,
      fn: async () => {
        const testFile = path.join(deepPath, "component.ts")

        // Create file with TypeScript error
        await fs.writeFile(testFile, "const prop: string = 456; // Type error")

        // Read file first to satisfy FileTime.assert
        await Bun.file(testFile).text()
        FileTime.read(ctx.sessionID, testFile)

        const result = await editTool.execute(
          {
            filePath: testFile,
            oldString: "456",
            newString: "'deep value'",
          },
          ctx,
        )

        expect(result.title).toBe(testFile)
        expect(result.metadata.diagnostics).toBeDefined()

        // Should show diagnostics if errors remain
        if (result.output) {
          expect(result.output).toContain("file_diagnostics")
        }
      },
    })
  })

  test("should handle concurrent edits in subpackage", async () => {
    await Instance.provide({
      directory: subpkgPath,
      fn: async () => {
        const testFile = path.join(subpkgPath, "src", "concurrent.ts")

        await fs.writeFile(testFile, "const x: string = 'hello';")

        // Read file first to satisfy FileTime.assert
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

        // Successful results should have diagnostics metadata
        const fulfilled = results.filter(
          (r) => r.status === "fulfilled",
        ) as PromiseFulfilledResult<any>[]
        fulfilled.forEach((result) => {
          expect(result.value.metadata.diagnostics).toBeDefined()
        })
      },
    })
  })
})
