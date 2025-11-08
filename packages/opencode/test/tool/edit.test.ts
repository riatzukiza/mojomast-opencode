import { describe, expect, test } from "bun:test"
import path from "path"
import { EditTool } from "../../src/tool/edit"
import { Instance } from "../../src/project/instance"
import { tmpdir } from "../fixture/fixture"
import { FileTime } from "../../src/file/time"
import { Bus } from "../../src/bus"
import { File } from "../../src/file"

const ctx = {
  sessionID: "test",
  messageID: "",
  toolCallID: "",
  agent: "build",
  abort: AbortSignal.any([]),
  metadata: () => {},
}

const editTool = await EditTool.init()

describe("tool.edit", () => {
  test("supports overlapping parallel edits on same file", async () => {
    await using fixture = await tmpdir()

    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const filePath = path.join(fixture.path, "parallel.txt")
        await Bun.write(filePath, ["first", "second"].join("\n"))
        FileTime.read(ctx.sessionID, filePath)

        const editStarted = new Promise<void>((resolve) => {
          const unsubscribe = Bus.subscribe(File.Event.Edited, async (event) => {
            if (event.properties.file !== filePath) return
            unsubscribe()
            resolve()
            await Bun.sleep(5)
          })
        })

        const firstEdit = editTool.execute(
          {
            filePath,
            oldString: "first",
            newString: "alpha",
          },
          ctx,
        )

        await editStarted

        const secondEdit = editTool.execute(
          {
            filePath,
            oldString: "second",
            newString: "beta",
          },
          ctx,
        )

        await expect(Promise.all([firstEdit, secondEdit])).resolves.toHaveLength(2)

        const updated = await Bun.file(filePath).text()
        expect(updated).toContain("alpha")
        expect(updated).toContain("beta")
      },
    })
  })

  test("requires file read before edit", async () => {
    await using fixture = await tmpdir()

    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const filePath = path.join(fixture.path, "needs-read.txt")
        await Bun.write(filePath, "original")

        await expect(
          editTool.execute(
            {
              filePath,
              oldString: "original",
              newString: "updated",
            },
            ctx,
          ),
        ).rejects.toThrow(/You must read the file/)
      },
    })
  })

  test("fails when file changes outside the session", async () => {
    await using fixture = await tmpdir()

    await Instance.provide({
      directory: fixture.path,
      fn: async () => {
        const filePath = path.join(fixture.path, "external-change.txt")
        await Bun.write(filePath, "initial")
        FileTime.read(ctx.sessionID, filePath)

        await Bun.sleep(10)
        await Bun.write(filePath, "external contents")

        await expect(
          editTool.execute(
            {
              filePath,
              oldString: "external contents",
              newString: "session edit",
            },
            ctx,
          ),
        ).rejects.toThrow(/has been modified since it was last read/)
      },
    })
  })
})
