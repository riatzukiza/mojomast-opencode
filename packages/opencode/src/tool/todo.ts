import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION_WRITE from "./todowrite.txt"
import { Todo } from "../session/todo"

export const TodoWriteTool = Tool.define("todowrite", {
  description: DESCRIPTION_WRITE,
  parameters: z.object({
    todos: z.array(Todo.Info).describe("The updated todo list"),
  }),
  async execute(params, opts) {
    // Validate each todo item has required fields
    for (const todo of params.todos) {
      if (!todo.id || typeof todo.id !== "string") {
        throw new Error("Todo item must have a valid 'id' field")
      }
      if (!todo.content || typeof todo.content !== "string") {
        throw new Error("Todo item must have a valid 'content' field")
      }
      if (!todo.status || typeof todo.status !== "string") {
        throw new Error("Todo item must have a valid 'status' field")
      }
      if (!todo.priority || typeof todo.priority !== "string") {
        throw new Error("Todo item must have a valid 'priority' field")
      }
    }

    await Todo.update({
      sessionID: opts.sessionID,
      todos: params.todos,
    })
    return {
      title: `${params.todos.filter((x) => x.status !== "completed").length} todos`,
      output: JSON.stringify(params.todos, null, 2),
      metadata: {
        todos: params.todos,
      },
    }
  },
})

export const TodoReadTool = Tool.define("todoread", {
  description: "Use this tool to read your todo list",
  parameters: z.object({}),
  async execute(_params, opts) {
    const todos = await Todo.get(opts.sessionID)
    return {
      title: `${todos.filter((x) => x.status !== "completed").length} todos`,
      metadata: {
        todos,
      },
      output: JSON.stringify(todos, null, 2),
    }
  },
})
