import { platform } from "os"

export interface TerminalInfo {
  isGitBash: boolean
  isWindows: boolean
  isMsys: boolean
  isCygwin: boolean
  shell: string | undefined
  terminal: string | undefined
}

export function detectTerminal(): TerminalInfo {
  const isWindows = platform() === "win32"
  const shell = process.env.SHELL
  const terminal = process.env.TERM || process.env.TERM_PROGRAM
  
  // Git Bash detection patterns
  const isMsys = shell?.includes("msys") || 
                 process.env.MSYSTEM !== undefined ||
                 process.env.MSYSCON !== undefined
                 
  const isCygwin = shell?.includes("cygwin") ||
                   process.env.CYGWIN !== undefined
  
  const isGitBash = isMsys || 
                    isCygwin || 
                    shell?.includes("bash") && isWindows ||
                    process.env.GIT_BASH === "true"

  return {
    isGitBash,
    isWindows,
    isMsys,
    isCygwin,
    shell,
    terminal
  }
}

export function isGitBashEnvironment(): boolean {
  return detectTerminal().isGitBash
}

export function getTerminalCapabilities(): {
  supportsTrueColor: boolean
  supportsUnicode: boolean
  supportsAnsiSequences: boolean
  pasteBehavior: "bracketed" | "simple" | "limited"
} {
  const terminal = detectTerminal()
  
  // Git Bash typically has good ANSI support but may have limitations
  const supportsTrueColor = terminal.terminal?.includes("xterm") || 
                           terminal.terminal?.includes("screen") ||
                           !terminal.isGitBash // Assume truecolor unless Git Bash
  
  const supportsUnicode = true // Modern Git Bash supports Unicode
  const supportsAnsiSequences = true // Git Bash supports ANSI sequences
  
  // Git Bash paste behavior can be problematic
  const pasteBehavior = terminal.isGitBash ? "limited" : "bracketed"
  
  return {
    supportsTrueColor,
    supportsUnicode,
    supportsAnsiSequences,
    pasteBehavior
  }
}