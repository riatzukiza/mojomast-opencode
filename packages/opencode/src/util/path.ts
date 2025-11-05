import { platform } from "os"
import path from "path"

export namespace PathUtil {
  export function isGitBash(): boolean {
    const platformName = platform()
    if (platformName !== "win32") return false
    
    // Check for Git Bash specific environment variables
    const shell = process.env.SHELL || ""
    const term = process.env.TERM || ""
    const msys = process.env.MSYSTEM || ""
    
    return shell.includes("bash") || 
           term.includes("msys") || 
           term.includes("cygwin") ||
           msys.includes("MINGW") ||
           msys.includes("MSYS") ||
           msys.includes("CYGWIN")
  }

  export function normalizeForDisplay(filePath: string): string {
    if (!isGitBash()) {
      return filePath
    }

    // Convert Windows paths to Unix-style for Git Bash display
    return filePath
      .replace(/^([A-Z]):/i, "/$1")  // C: -> /C
      .replace(/\\/g, "/")            // \ -> /
      .toLowerCase()                  // Normalize to lowercase for consistency
  }

  export function normalizeRelativePath(relativePath: string): string {
    if (!isGitBash()) {
      return relativePath
    }

    // For relative paths, just normalize separators
    return relativePath.replace(/\\/g, "/")
  }

  export function formatPathForDisplay(filePath: string, basePath?: string): string {
    let displayPath = filePath
    
    if (basePath && filePath.startsWith(basePath)) {
      displayPath = path.relative(basePath, filePath)
    }

    return normalizeForDisplay(displayPath)
  }
}