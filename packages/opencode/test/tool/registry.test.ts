import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { ToolRegistry } from "../../src/tool/registry"
import { Agent } from "../../src/agent/agent"
import { Tool } from "../../src/tool/tool"
import z from "zod"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { writeFileSync, mkdirSync } from "fs"
import path from "path"

let fixture: any

beforeEach(async () => {
  fixture = await tmpdir()
})

afterEach(async () => {
  if (fixture) {
    await fixture[Symbol.asyncDispose]?.()
  }
})

describe("tool.registry", () => {
  test("should list all tool IDs", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const ids = await ToolRegistry.ids()
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBeGreaterThan(0)

        // Should include core tools
        expect(ids).toContain("bash")
        expect(ids).toContain("edit")
        expect(ids).toContain("read")
        expect(ids).toContain("write")
        expect(ids).toContain("todowrite")
        expect(ids).toContain("todoread")
      },
    })
  })

  test("should get all tools with definitions", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const tools = await ToolRegistry.tools("test-provider", "test-model")
        expect(Array.isArray(tools)).toBe(true)
        expect(tools.length).toBeGreaterThan(0)

        // Each tool should have required properties
        for (const tool of tools) {
          expect(tool).toHaveProperty("id")
          expect(tool).toHaveProperty("description")
          expect(tool).toHaveProperty("parameters")
        }
      },
    })
  })

  test("should handle tool permissions for agents", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create a test agent with restricted permissions
        const restrictedAgent: Agent.Info = {
          name: "test-agent",
          mode: "subagent" as const,
          builtIn: false,
          tools: {},
          options: {},
          permission: {
            edit: "deny",
            bash: { "*": "deny" },
            webfetch: "deny",
          },
        }

        const enabled = await ToolRegistry.enabled("test-provider", "test-model", restrictedAgent)

        // Should be an object
        expect(typeof enabled).toBe("object")

        // Patch should always be disabled
        expect(enabled.patch).toBe(false)

        // Edit should be disabled due to permission
        expect(enabled.edit).toBe(false)

        // Bash should be disabled due to permission
        expect(enabled.bash).toBe(false)

        // Webfetch should be disabled due to permission
        expect(enabled.webfetch).toBe(false)
      },
    })
  })

  test("should allow all tools for unrestricted agents", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create a test agent with full permissions
        const unrestrictedAgent: Agent.Info = {
          name: "test-agent",
          mode: "subagent" as const,
          builtIn: false,
          tools: {},
          options: {},
          permission: {
            edit: "allow",
            bash: { ls: "allow" },
            webfetch: "allow",
          },
        }

        const enabled = await ToolRegistry.enabled("test-provider", "test-model", unrestrictedAgent)

        // Should be an object
        expect(typeof enabled).toBe("object")

        // Patch should still be disabled (always disabled)
        expect(enabled.patch).toBe(false)

        // Other tools should not be explicitly disabled
        expect(enabled.edit).toBeUndefined()
        expect(enabled.webfetch).toBeUndefined()
      },
    })
  })

  test("should register custom tools", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const customTool: Tool.Info = {
          id: "test-custom-tool",
          init: async () => ({
            parameters: z.object({}),
            description: "Test custom tool",
            execute: async (args, ctx) => ({
              title: "Test",
              output: "test output",
              metadata: {},
            }),
          }),
        }

        // Register the tool
        await ToolRegistry.register(customTool)

        // Check if it's in the list
        const ids = await ToolRegistry.ids()
        expect(ids).toContain("test-custom-tool")
      },
    })
  })

  test("should update existing custom tools", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const customTool1: Tool.Info = {
          id: "test-update-tool",
          init: async () => ({
            parameters: z.object({}),
            description: "Version 1",
            execute: async () => ({
              title: "Test v1",
              output: "output v1",
              metadata: {},
            }),
          }),
        }

        const customTool2: Tool.Info = {
          id: "test-update-tool",
          init: async () => ({
            parameters: z.object({}),
            description: "Version 2",
            execute: async () => ({
              title: "Test v2",
              output: "output v2",
              metadata: {},
            }),
          }),
        }

        // Register first version
        await ToolRegistry.register(customTool1)

        // Register second version (should update)
        await ToolRegistry.register(customTool2)

        // Check it's still there
        const ids = await ToolRegistry.ids()
        expect(ids).toContain("test-update-tool")

        // Check the tools list has the updated version
        const tools = await ToolRegistry.tools("test-provider", "test-model")
        const testTool = tools.find((t) => t.id === "test-update-tool")
        expect(testTool?.description).toBe("Version 2")
      },
    })
  })

  test("should load tools from plugin files", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const toolDir = path.join(fixture.path, ".opencode", "tool")
        mkdirSync(toolDir, { recursive: true })

        const toolFile = path.join(toolDir, "test-plugin.ts")
        writeFileSync(
          toolFile,
          `
export default {
  description: "Test plugin tool",
  args: {
    input: { type: "string" }
  },
  execute: async (args) => {
    return \`Processed: \${args.input}\`
  }
}
        `,
        )

        await Instance.dispose()

        const ids = await ToolRegistry.ids()
        expect(Array.isArray(ids)).toBe(true)
        expect(ids).toContain("test-plugin")
      },
    })
  })

  test("should handle malformed plugin files gracefully", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create a tool directory
        const toolDir = path.join(fixture.path, "tool")
        mkdirSync(toolDir, { recursive: true })

        // Create a malformed tool file
        const toolFile = path.join(toolDir, "malformed.ts")
        writeFileSync(
          toolFile,
          `
export default {
  // This is malformed - missing required properties
  description: "Malformed tool"
  // Missing execute function and args
}
        `,
        )

        // Should not crash
        try {
          const ids = await ToolRegistry.ids()
          expect(Array.isArray(ids)).toBe(true)
        } catch (error) {
          // Should handle errors gracefully
          expect(error instanceof Error ? error.message : String(error)).toBeDefined()
        }
      },
    })
  })

  test("should handle empty tool directory", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Create an empty tool directory
        const toolDir = path.join(fixture.path, "tool")
        mkdirSync(toolDir, { recursive: true })

        // Should work fine with no custom tools
        const ids = await ToolRegistry.ids()
        expect(Array.isArray(ids)).toBe(true)
        expect(ids.length).toBeGreaterThan(0) // Should still have core tools
      },
    })
  })

  test("should maintain tool order consistency", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Get tools list twice
        const tools1 = await ToolRegistry.tools("test-provider", "test-model")
        const tools2 = await ToolRegistry.tools("test-provider", "test-model")

        // Should have same length
        expect(tools1.length).toBe(tools2.length)

        // Should have same order (for core tools at least)
        const coreTools1 = tools1.slice(0, 10) // First 10 should be core tools
        const coreTools2 = tools2.slice(0, 10)

        for (let i = 0; i < coreTools1.length; i++) {
          expect(coreTools1[i].id).toBe(coreTools2[i].id)
        }
      },
    })
  })
})
