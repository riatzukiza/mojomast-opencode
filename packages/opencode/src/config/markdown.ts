import { NamedError } from "@/util/error"
import { Platform } from "@/util/platform"
import matter from "gray-matter"
import { z } from "zod"

export namespace ConfigMarkdown {
  export const FILE_REGEX = /(?<![\w`])@(\.?[^\s`,.]*(?:\.[^\s`,.]+)*)/g
  export const SHELL_REGEX = /!`([^`]+)`/g

  export function files(template: string) {
    const matches = Array.from(template.matchAll(FILE_REGEX))

    // Normalize file paths for Git Bash
    if (Platform.isGitBash()) {
      return matches.map((match) => {
        const filePath = match[1]
        const normalizedPath = Platform.normalizePath(filePath)
        // Create a new match array with normalized path
        const newMatch = [...match]
        newMatch[1] = normalizedPath
        return newMatch as RegExpMatchArray
      })
    }

    return matches
  }

  export function shell(template: string) {
    const matches = Array.from(template.matchAll(SHELL_REGEX))

    // Normalize shell commands for Git Bash display
    if (Platform.isGitBash()) {
      return matches.map((match) => {
        const command = match[1]
        // Convert Windows-style paths in shell commands to Unix-style for Git Bash
        const normalizedCommand = command.replace(/([A-Za-z]):\\/g, "/$1")
        const newMatch = [...match]
        newMatch[1] = normalizedCommand
        return newMatch as RegExpMatchArray
      })
    }

    return matches
  }

  export async function parse(filePath: string) {
    const template = await Bun.file(filePath).text()

    try {
      const md = matter(template)
      return md
    } catch (err) {
      throw new FrontmatterError(
        {
          path: filePath,
          message: `Failed to parse YAML frontmatter: ${err instanceof Error ? err.message : String(err)}`,
        },
        { cause: err },
      )
    }
  }

  export const FrontmatterError = NamedError.create(
    "ConfigFrontmatterError",
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  )
}
