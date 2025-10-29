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
    // Validate required parameters - throw errors for completely invalid input
    if (!args.file && Object.keys(args).length === 0) {
      throw new Error("File parameter is required")
    }

    if (!args.file) {
      throw new Error("File parameter is required")
    }

    // Handle missing optional parameters gracefully with defaults
    const file = args.file
    const line = args.line ?? 0
    const character = args.character ?? 0

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
        title: file + ":" + line + ":" + character,
        metadata: {
          result: [],
          error: error instanceof Error ? error.message : String(error),
        },
        output: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2),
      }
    }
  },
})
