import z from "zod"
import { Tool } from "./tool"
import path from "path"
import { LSP } from "../lsp"
import DESCRIPTION from "./lsp-hover.txt"
import { Instance } from "../project/instance"

export const LspHoverTool = Tool.define("lsp_hover", {
  description: DESCRIPTION,
  parameters: z.object({
    file: z.string().describe("The path to the file to get diagnostics."),
    line: z.number().describe("The line number to get diagnostics."),
    character: z.number().describe("The character number to get diagnostics."),
  }),
  execute: async (args) => {
    // Validate required parameters
    if (!args.file) {
      throw new Error("File parameter is required")
    }

    if (args.line === undefined || args.line === null) {
      throw new Error("Line parameter is required")
    }

    if (args.character === undefined || args.character === null) {
      throw new Error("Character parameter is required")
    }

    const file = args.file
    const line = args.line
    const character = args.character

    const resolvedFile = path.isAbsolute(file) ? file : path.join(Instance.directory, file)

    try {
      await LSP.touchFile(resolvedFile, true)
      const result = await LSP.hover({
        file: resolvedFile,
        line,
        character,
      })

      return {
        title: path.relative(Instance.worktree, resolvedFile) + ":" + line + ":" + character,
        metadata: {
          result,
        },
        output: JSON.stringify(result, null, 2),
      }
    } catch (error) {
      // Return error information in structured format
      return {
        title: path.relative(Instance.worktree, resolvedFile) + ":" + line + ":" + character,
        metadata: {
          result: [],
        },
        output: JSON.stringify(
          { error: error instanceof Error ? error.message : String(error) },
          null,
          2,
        ),
      }
    }
  },
})
