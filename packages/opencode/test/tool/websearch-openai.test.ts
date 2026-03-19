import { describe, expect, test } from "bun:test"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { ToolRegistry } from "../../src/tool/registry"

describe("tool.websearch (openai)", () => {
  test("websearch is available for the openai provider without Exa enabled", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const tools = await ToolRegistry.tools({ providerID: "openai", modelID: "gpt-5-nano" })
        const ids = tools.map((t) => t.id)

        expect(ids).toContain("websearch")
        // codesearch remains Exa-only
        expect(ids).not.toContain("codesearch")
      },
    })
  })
})
