export namespace Platform {
  export function isWindows(): boolean {
    return process.platform === "win32"
  }

  export function isGitBash(): boolean {
    if (!isWindows()) return false

    // Check environment variables for Git Bash indicators
    const shell = process.env.SHELL || ""
    const term = process.env.TERM || ""
    const msys = process.env.MSYSTEM || ""

    // Git Bash typically sets these environment variables
    const isGitBashShell =
      shell.includes("bash") &&
      (shell.includes("/usr/bin/bash") || shell.includes("Git") || shell.includes("mingw"))

    const isMsysEnvironment =
      msys.includes("MINGW") || msys.includes("MSYS") || msys.includes("CYGWIN")

    const isGitTerminal = term.includes("git") || term.includes("mintty") || term.includes("cygwin")

    return isGitBashShell || isMsysEnvironment || isGitTerminal
  }

  export function isWindowsTerminal(): boolean {
    if (!isWindows()) return false
    const wtSession = process.env.WT_SESSION
    return !!wtSession
  }

  export function isPowerShell(): boolean {
    if (!isWindows()) return false
    const shell = process.env.SHELL || ""
    const comspec = process.env.COMSPEC || ""
    return shell.includes("powershell") || shell.includes("pwsh") || comspec.includes("powershell")
  }

  export function isCmd(): boolean {
    if (!isWindows()) return false
    const comspec = process.env.COMSPEC || ""
    return comspec.includes("cmd")
  }

  export function getTerminalType():
    | "git-bash"
    | "windows-terminal"
    | "powershell"
    | "cmd"
    | "other" {
    if (isGitBash()) return "git-bash"
    if (isWindowsTerminal()) return "windows-terminal"
    if (isPowerShell()) return "powershell"
    if (isCmd()) return "cmd"
    return "other"
  }

  export function normalizePath(path: string): string {
    if (!isWindows()) return path

    // For Git Bash, convert Windows paths to Unix-style for consistency
    if (isGitBash()) {
      return path.replace(/^[A-Za-z]:/, (match) => `/${match.toLowerCase()}`).replace(/\\/g, "/")
    }

    return path
  }

  export function shouldUseAnsiColors(): boolean {
    const terminalType = getTerminalType()

    // Git Bash may have limited ANSI support
    if (terminalType === "git-bash") {
      const term = process.env.TERM || ""
      const colorterm = process.env.COLORTERM || ""

      // Check if terminal supports color
      return (
        term.includes("color") ||
        term.includes("256") ||
        colorterm.includes("truecolor") ||
        colorterm.includes("24bit")
      )
    }

    // Other Windows terminals generally support ANSI colors
    return true
  }

  export function shouldUseUnicode(): boolean {
    const terminalType = getTerminalType()

    if (terminalType === "git-bash") {
      const lang = process.env.LANG || process.env.LC_ALL || ""
      return lang.includes("UTF-8") || lang.includes("utf8")
    }

    return true
  }
}
