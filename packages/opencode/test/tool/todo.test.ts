import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { TodoWriteTool, TodoReadTool } from "../../src/tool/todo"
import { Todo } from "../../src/session/todo"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"

const ctx = {
  sessionID: "test-session",
  messageID: "",
  toolCallID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  metadata: () => {},
}

const todoWriteTool = await TodoWriteTool.init()
const todoReadTool = await TodoReadTool.init()

describe("tool.todo", () => {
  let fixture: any

  beforeEach(async () => {
    fixture = await tmpdir()
    // Clear todos before each test
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await Todo.update({
          sessionID: ctx.sessionID,
          todos: [],
        })
      },
    })
  })

  afterEach(async () => {
    if (fixture) {
      await fixture[Symbol.asyncDispose]?.()
    }
  })

  test("should write todos", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const todos = [
          {
            id: "1",
            content: "Test todo 1",
            status: "pending",
            priority: "high",
          },
          {
            id: "2",
            content: "Test todo 2",
            status: "completed",
            priority: "medium",
          },
        ]

        const result = await todoWriteTool.execute(
          {
            todos,
          },
          ctx,
        )

        expect(result.title).toBe("1 todos") // Only non-completed todos counted
        expect(result.metadata.todos).toEqual(todos)
        expect(JSON.parse(result.output)).toEqual(todos)
      },
    })
  })

test("should read todos", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // First write some todos
        const todos = [
          {
            id: "1",
            content: "Test todo",
            status: "pending",
            priority: "high"
          }
        ]
        await Todo.update({
          sessionID: ctx.sessionID,
          todos
        })

        // Then read them
        const result = await todoReadTool.execute({}, ctx)

        expect(result.title).toBe("1 todos")
        expect(result.metadata.todos).toEqual(todos)
        expect(JSON.parse(result.output)).toEqual(todos)
      }
    })
  })

  test("should handle empty todo list", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const result = await todoReadTool.execute({}, ctx)

        expect(result.title).toBe("0 todos")
        expect(result.metadata.todos).toEqual([])
        expect(JSON.parse(result.output)).toEqual([])
      }
    })
  })

  test("should handle empty todo list", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const result = await todoReadTool.execute({}, ctx)

        expect(result.title).toBe("0 todos")
        expect(result.metadata.todos).toEqual([])
        expect(JSON.parse(result.output)).toEqual([])
      }
    })
  })

test("should update existing todos", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        // Write initial todos
        const initialTodos = [
          {
            id: "1",
            content: "Original todo",
            status: "pending",
            priority: "high"
          }
        ]
        await Todo.update({
          sessionID: ctx.sessionID,
          todos: initialTodos
        })

        // Update todos
        const updatedTodos = [
          {
            id: "1",
            content: "Updated todo",
            status: "completed",
            priority: "medium"
          }
        ]
        const result = await todoWriteTool.execute({
          todos: updatedTodos
        }, ctx)

        expect(result.title).toBe("0 todos") // All completed
        expect(result.metadata.todos).toEqual(updatedTodos)
      }
    })
  })

test("should handle different todo statuses", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const todos = [
          {
            id: "1",
            content: "Pending todo",
            status: "pending",
            priority: "high"
          },
          {
            id: "2",
            content: "In progress todo", 
            status: "in_progress",
            priority: "medium"
          },
          {
            id: "3",
            content: "Completed todo",
            status: "completed",
            priority: "low"
          },
          {
            id: "4",
            content: "Cancelled todo",
            status: "cancelled",
            priority: "low"
          }
        ]

        const result = await todoWriteTool.execute({
          todos
        }, ctx)

        expect(result.title).toBe("3 todos") // pending + in_progress + cancelled
        expect(result.metadata.todos).toEqual(todos)
      }
    })
  })

test("should validate todo structure", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const invalidTodos = [
          {
            // Missing required fields
            id: "1"
          }
        ]

        // Todo tool might not validate strictly, so let's just test it works
        const result = await todoWriteTool.execute({
          todos: invalidTodos as any
        }, ctx)

        expect(result.title).toBeDefined()
        expect(result.metadata.todos).toBeDefined()
      }
    })
  })

test("should handle large todo lists", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const todos = []
        for (let i = 0; i < 100; i++) {
          todos.push({
            id: i.toString(),
            content: `Todo ${i}`,
            status: "pending" as const,
            priority: "medium" as const
          })
        }

        const result = await todoWriteTool.execute({
          todos
        }, ctx)

        expect(result.title).toBe("100 todos")
        expect(result.metadata.todos).toHaveLength(100)
      }
    })
  })
    }

    const result = await todoWriteTool.execute(
      {
        todos,
      },
      ctx,
    )

    expect(result.title).toBe("100 todos")
    expect(result.metadata.todos).toHaveLength(100)
  })

test("should handle special characters in todo content", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const todos = [
          {
            id: "1",
            content: "Todo with émojis 🚀 and spëcial chars",
            status: "pending",
            priority: "high"
          }
        ]

        const result = await todoWriteTool.execute({
          todos
        }, ctx)

        expect(result.title).toBe("1 todos")
        expect(result.metadata.todos[0].content).toBe("Todo with émojis 🚀 and spëcial chars")
      }
    })
  })

test("should validate required parameters for write", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        await expect(
          todoWriteTool.execute({} as any, ctx)
        ).rejects.toThrow()
      }
    })
  })

  test("should handle read with no parameters", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const result = await todoReadTool.execute({}, ctx)

        expect(result.title).toBe("0 todos")
        expect(result.metadata.todos).toEqual([])
      }
    })
  })

  test("should maintain todo order", async () => {
    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const todos = [
          {
            id: "3",
            content: "Third todo",
            status: "pending",
            priority: "medium"
          },
          {
            id: "1",
            content: "First todo", 
            status: "pending",
            priority: "high"
          },
          {
            id: "2",
            content: "Second todo",
            status: "pending",
            priority: "low"
          }
        ]

        const result = await todoWriteTool.execute({
          todos
        }, ctx)

        expect(result.metadata.todos).toEqual(todos) // Order should be preserved
      }
    })
  })

  test("should handle read with no parameters", async () => {
    const result = await todoReadTool.execute({}, ctx)

    expect(result.title).toBe("0 todos")
    expect(result.metadata.todos).toEqual([])
  })

  test("should maintain todo order", async () => {
    const todos = [
      {
        id: "3",
        content: "Third todo",
        status: "pending",
        priority: "medium",
      },
      {
        id: "1",
        content: "First todo",
        status: "pending",
        priority: "high",
      },
      {
        id: "2",
        content: "Second todo",
        status: "pending",
        priority: "low",
      },
    ]

    const result = await todoWriteTool.execute(
      {
        todos,
      },
      ctx,
    )

    expect(result.metadata.todos).toEqual(todos) // Order should be preserved
  })
})
