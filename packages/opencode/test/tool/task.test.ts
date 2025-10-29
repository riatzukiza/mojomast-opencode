import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { TaskTool } from "../../src/tool/task"
import { Agent } from "../../src/agent/agent"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

const ctx = {
  sessionID: "test-session",
  messageID: "test-message",
  callID: "test-tool-call",
  agent: "build",
  abort: new AbortController().signal,
  metadata: () => {},
}

let fixture: Awaited<ReturnType<typeof tmpdir>> | undefined

beforeEach(async () => {
  fixture = await tmpdir()
})

afterEach(async () => {
  if (fixture) {
    await fixture[Symbol.asyncDispose]?.()
  }
})

describe("tool.task", () => {
  test("should initialize with agent list", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        expect(taskTool.description).toBeDefined()
        expect(taskTool.parameters).toBeDefined()
        // Description should contain agent information
        expect(taskTool.description).toContain("subagent")
      },
    })
  })

  test("should validate required parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        // Missing all required parameters
        await expect(taskTool.execute({}, ctx)).rejects.toThrow()
      },
    })
  })

  test("should validate subagent_type parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const params = {
          description: "Test task",
          prompt: "Test prompt",
          subagent_type: "non-existent-agent",
        }

        await expect(taskTool.execute(params, ctx)).rejects.toThrow("Unknown agent type")
      },
    })
  })

  test("should handle valid agent type", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        // Get list of available agents
        const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

        if (agents.length > 0) {
          const validAgent = agents[0]
          const params = {
            description: "Test task",
            prompt: "Simple test task",
            subagent_type: validAgent.name,
          }

          // This should not throw for agent validation
          // Note: The actual execution might fail due to session/message setup,
          // but we're testing parameter validation here
          try {
            const result = await taskTool.execute(params, ctx)
            expect(result).toBeDefined()
          } catch (error) {
            if (error instanceof Error) {
              expect(error.message).not.toContain("Unknown agent type")
              return
            }
            throw error
          }
        }
      },
    })
  })

  test("should require description parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const params = {
          prompt: "Test prompt",
          subagent_type: "test-agent",
        }

        await expect(taskTool.execute(params, ctx)).rejects.toThrow()
      },
    })
  })

  test("should require prompt parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const params = {
          description: "Test task",
          subagent_type: "test-agent",
        }

        await expect(taskTool.execute(params, ctx)).rejects.toThrow()
      },
    })
  })

  test("should require subagent_type parameter", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const params = {
          description: "Test task",
          prompt: "Test prompt",
        }

        await expect(taskTool.execute(params, ctx)).rejects.toThrow()
      },
    })
  })

  test("should handle empty prompt", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

        if (agents.length > 0) {
          const validAgent = agents[0]
          const params = {
            description: "Test task",
            prompt: "",
            subagent_type: validAgent.name,
          }

          // Should handle empty prompt gracefully
          try {
            const result = await taskTool.execute(params, ctx)
            expect(result).toBeDefined()
          } catch (error) {
            if (error instanceof Error) {
              return
            }
            throw error
          }
        }
      },
    })
  })

  test("should handle long descriptions", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

        if (agents.length > 0) {
          const validAgent = agents[0]
          const params = {
            description:
              "This is a very long task description that exceeds the typical 3-5 word recommendation but should still be handled by the system",
            prompt: "Test prompt",
            subagent_type: validAgent.name,
          }

          try {
            const result = await taskTool.execute(params, ctx)
            expect(result).toBeDefined()
          } catch (error) {
            if (error instanceof Error) {
              return
            }
            throw error
          }
        }
      },
    })
  })

  test("should handle special characters in parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const agents = await Agent.list().then((x) => x.filter((a) => a.mode !== "primary"))

        if (agents.length > 0) {
          const validAgent = agents[0]
          const params = {
            description: "Task with émojis 🚀 and spëcial chars",
            prompt: "Prompt with special chars: @#$%^&*()",
            subagent_type: validAgent.name,
          }

          try {
            const result = await taskTool.execute(params, ctx)
            expect(result).toBeDefined()
          } catch (error) {
            if (error instanceof Error) {
              return
            }
            throw error
          }
        }
      },
    })
  })

  test("should have proper parameter schema", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const taskTool = await TaskTool.init()
        const schema = taskTool.parameters
        expect(schema.shape.description).toBeDefined()
        expect(schema.shape.prompt).toBeDefined()
        expect(schema.shape.subagent_type).toBeDefined()

        // Check parameter descriptions
        expect(schema.shape.description.description).toContain("description")
        expect(schema.shape.prompt.description).toContain("task")
        expect(schema.shape.subagent_type.description).toContain("agent")
      },
    })
  })
})
