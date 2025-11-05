import { describe, test, expect } from "bun:test"
import { Agent } from "../../src/agent/agent"
import { ToolRegistry } from "../../src/tool/registry"

describe("Disabled Tools Filtering", () => {
  test("should filter out globally disabled tools from available tools list", async () => {
    const allTools = [
      "bash",
      "read",
      "write",
      "edit",
      "list",
      "glob",
      "grep",
      "webfetch",
      "task",
      "todowrite",
      "todoread",
    ]

    // Mock config with some tools disabled globally
    const mockConfig = {
      tools: {
        bash: false,
        webfetch: false,
      },
    } as any

    // Mock agent with default permissions
    const mockAgent = await Agent.Info.parseAsync({
      name: "temp",
      model: {
        modelID: "temp",
        providerID: "temp",
      },
      prompt: "temp",
      tools: mockConfig.tools,
      permission: {
        edit: "allow",
        bash: { "*": "allow" },
        webfetch: "allow",
      },
      mode: "all",
      builtIn: false,
      options: {},
    })

    const enabledTools = await ToolRegistry.enabled("", "", mockAgent)
    const availableTools = allTools.filter((tool) => {
      const globallyDisabled = mockConfig.tools[tool] === false
      const agentDisabled = enabledTools[tool] === false
      return !globallyDisabled && !agentDisabled
    })

    expect(availableTools).not.toContain("bash")
    expect(availableTools).not.toContain("webfetch")
    expect(availableTools).toContain("read")
    expect(availableTools).toContain("write")
    expect(availableTools).toContain("edit")
    expect(availableTools.length).toBe(allTools.length - 2)
  })

  test("should include all tools when none are disabled", async () => {
    const allTools = [
      "bash",
      "read",
      "write",
      "edit",
      "list",
      "glob",
      "grep",
      "webfetch",
      "task",
      "todowrite",
      "todoread",
    ]

    // Mock config with no tools disabled
    const mockConfig = {
      tools: {},
    } as any

    // Mock agent with default permissions
    const mockAgent = await Agent.Info.parseAsync({
      name: "temp",
      model: {
        modelID: "temp",
        providerID: "temp",
      },
      prompt: "temp",
      tools: mockConfig.tools,
      permission: {
        edit: "allow",
        bash: { "*": "allow" },
        webfetch: "allow",
      },
      mode: "all",
      builtIn: false,
      options: {},
    })

    const enabledTools = await ToolRegistry.enabled("", "", mockAgent)
    const availableTools = allTools.filter((tool) => {
      const globallyDisabled = mockConfig.tools[tool] === false
      const agentDisabled = enabledTools[tool] === false
      return !globallyDisabled && !agentDisabled
    })

    expect(availableTools).toEqual(allTools)
  })

  test("should filter out tools disabled by agent permissions", async () => {
    const allTools = [
      "bash",
      "read",
      "write",
      "edit",
      "list",
      "glob",
      "grep",
      "webfetch",
      "task",
      "todowrite",
      "todoread",
    ]

    // Mock config with no globally disabled tools
    const mockConfig = {
      tools: {},
    } as any

    // Mock agent with edit permission denied
    const mockAgent = await Agent.Info.parseAsync({
      name: "temp",
      model: {
        modelID: "temp",
        providerID: "temp",
      },
      prompt: "temp",
      tools: mockConfig.tools,
      permission: {
        edit: "deny",
        bash: { "*": "allow" },
        webfetch: "allow",
      },
      mode: "all",
      builtIn: false,
      options: {},
    })

    const enabledTools = await ToolRegistry.enabled("", "", mockAgent)
    const availableTools = allTools.filter((tool) => {
      const globallyDisabled = mockConfig.tools[tool] === false
      const agentDisabled = enabledTools[tool] === false
      return !globallyDisabled && !agentDisabled
    })

    expect(availableTools).not.toContain("edit")
    expect(availableTools).not.toContain("patch") // patch is disabled when edit is denied
    expect(availableTools).not.toContain("write") // write is disabled when edit is denied
    expect(availableTools).toContain("bash")
    expect(availableTools).toContain("read")
  })
})
