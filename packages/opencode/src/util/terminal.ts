import { platform } from "os"

import { stripOSC } from "./osc"
export namespace TerminalUtil {
  export interface TerminalCapabilities {
    supportsTrueColor: boolean
    supportsUnicode: boolean
    supportsAnsiColors: boolean
    isGitBash: boolean
  }

  export function getTerminalCapabilities(): TerminalCapabilities {
    const isWindows = platform() === "win32"
    const term = process.env.TERM || ""
    const colorterm = process.env.COLORTERM || ""
    const isGitBash = isWindows && (
      term.includes("msys") || 
      term.includes("cygwin") ||
      term.includes("mintty") ||
      process.env.MSYSTEM?.includes("MINGW") ||
      process.env.MSYSTEM?.includes("MSYS")
    )

    return {
      supportsTrueColor: colorterm.includes("24bit") || colorterm.includes("truecolor"),
      supportsUnicode: true, // Most modern terminals support Unicode
      supportsAnsiColors: true, // Git Bash typically supports ANSI colors
      isGitBash
    }
  }

  export function shouldStripAnsi(content: string, capabilities?: TerminalCapabilities): boolean {
    const caps = capabilities || getTerminalCapabilities()
    
    // Don't strip ANSI for Git Bash if it supports colors
    if (caps.isGitBash && caps.supportsAnsiColors) {
      return false
    }
    
    // Strip for very basic terminals
    return !caps.supportsAnsiColors
  }

  export function processAnsiContent(content: string, capabilities?: TerminalCapabilities): string {
    const caps = capabilities || getTerminalCapabilities()
    
    // Strip OSC sequences first to handle stray iTerm2 payloads
    content = stripOSC(content)
    
    if (shouldStripAnsi(content, caps)) {
      // Use Bun's built-in ANSI stripper for basic terminals
      return Bun.stripANSI(content)
    }
    
    // For Git Bash, ensure ANSI sequences are properly formatted
    if (caps.isGitBash) {
      // Git Bash may need specific ANSI sequence formatting
      return content
        .replace(/\x1b\[/g, "\x1b[") // Ensure ESC[ is properly formatted
        .replace(/\x1b\]/g, "\x1b]") // Ensure ESC] is properly formatted
    }
    
    return content
  }
}