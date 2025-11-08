import { describe, expect, test } from "bun:test"
import path from "path"

import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { Todo } from "../../src/session/todo"
import { SessionRevert } from "../../src/session/revert"
import { Identifier } from "../../src/id/id"
import { MessageV2 } from "../../src/session/message-v2"

const projectRoot = path.join(__dirname, "../..")

async function writeTodoMessage(sessionID: string, todos: Todo.Info[]) {
  const messageID = Identifier.ascending("message")
  const timestamp = Date.now()

  await Session.updateMessage({
    id: messageID,
    sessionID,
    role: "user",
    time: {
      created: timestamp,
    },
  } as MessageV2.User)

  const part: MessageV2.ToolPart = {
    id: Identifier.ascending("part"),
    sessionID,
    messageID,
    type: "tool",
    callID: Identifier.ascending("message"),
    tool: "todowrite",
    state: {
      status: "completed",
      input: {
        todos,
      },
      output: JSON.stringify(todos),
      title: `${todos.length} todos`,
      metadata: {
        todos,
      },
      time: {
        start: timestamp,
        end: timestamp,
      },
    },
  }

  await Session.updatePart(part)
  await Todo.update({ sessionID, todos })

  return messageID
}

// Regression test for:
// "undo does not undo todo list, resulting in agents continuing on the same path as the undo"
//
// This encodes the EXPECTED behavior:
// - Undoing a message that changed the todo list should restore the previous todos.
// With the current implementation, this should FAIL, exposing the bug.
describe("SessionRevert and Todo integration", () => {
  test("undoing a later message that changed todos should restore previous todo list", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const session = await Session.create({})

        // 1) Initial todos that represent the original plan
        const initialTodos: Todo.Info[] = [
          {
            id: "step-1",
            content: "initial plan step",
            status: "pending",
            priority: "high",
          },
        ]
        await writeTodoMessage(session.id, initialTodos)

        // 2) Create a later message (todowrite run) that updates the todo list
        const updatedTodos: Todo.Info[] = [
          {
            id: "step-2",
            content: "updated plan step",
            status: "pending",
            priority: "high",
          },
        ]
        const laterMessageID = await writeTodoMessage(session.id, updatedTodos)

        // Sanity check: before undo, we see the updated todos
        const beforeRevert = await Todo.get(session.id)
        expect(beforeRevert).toEqual(updatedTodos)

        // 4) Perform undo targeting the later message
        await SessionRevert.revert({
          sessionID: session.id,
          messageID: laterMessageID,
        })

        // Apply cleanup: mimics committing the undo (drop reverted messages/parts)
        const sessionAfterRevert = await Session.get(session.id)
        await SessionRevert.cleanup(sessionAfterRevert)

        // 5) After undo, we EXPECT todos to be restored to the initial list.
        // Today, todo state is not reverted, so this should FAIL until fixed.
        const afterRevert = await Todo.get(session.id)
        expect(afterRevert).toEqual(initialTodos)

        await Session.remove(session.id)
      },
    })
  })

  test("the tui displays undone todo state after undo", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const session = await Session.create({})

        const initialTodos: Todo.Info[] = [
          {
            id: "step-1",
            content: "initial plan step",
            status: "pending",
            priority: "high",
          },
        ]
        await writeTodoMessage(session.id, initialTodos)

        const updatedTodos: Todo.Info[] = [
          {
            id: "step-2",
            content: "updated plan step",
            status: "pending",
            priority: "high",
          },
        ]
        const laterMessageID = await writeTodoMessage(session.id, updatedTodos)

        // Undo the latest message but DO NOT trigger cleanup yet (mirrors actual undo UX)
        await SessionRevert.revert({
          sessionID: session.id,
          messageID: laterMessageID,
        })

        const afterUndo = await Todo.get(session.id)
        expect(afterUndo).toEqual(initialTodos)

        await Session.remove(session.id)
      },
    })
  })
})
