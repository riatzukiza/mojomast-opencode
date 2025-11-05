import path from "path"
import { detectTerminal } from "./terminal"

export function normalizePathForDisplay(filePath: string): string {
  const terminal = detectTerminal()
  
  if (!terminal.isGitBash) {
    return filePath
  }
  
  // Convert Windows paths to Unix-style for Git Bash display
  let normalized = filePath
  
  // Convert drive letters like C:\ to /c/
  normalized = normalized.replace(/^([A-Za-z]):\\/, "/$1/")
  
  // Convert backslashes to forward slashes
  normalized = normalized.replace(/\\/g, "/")
  
  // Handle UNC paths like \\server\share to //server/share
  normalized = normalized.replace(/^\\\\/, "//")
  
  return normalized
}

export function normalizePathForSystem(filePath: string): string {
  const terminal = detectTerminal()
  
  if (!terminal.isGitBash) {
    return filePath
  }
  
  // Convert Unix-style paths back to Windows paths when needed
  let normalized = filePath
  
  // Convert /c/ back to C:\
  normalized = normalized.replace(/^\/([A-Za-z])\//, "$1:\\")
  
  // Convert //server\share back to \\server\share
  normalized = normalized.replace(/^\/\//, "\\\\")
  
  // Convert forward slashes to backslashes for Windows paths
  if (process.platform === "win32") {
    normalized = normalized.replace(/\//g, "\\")
  }
  
  return normalized
}

export function shouldNormalizePaths(): boolean {
  return detectTerminal().isGitBash
}

export function getWorkingDirectory(): string {
  const terminal = detectTerminal()
  
  if (terminal.isGitBash) {
    // In Git Bash, PWD is usually Unix-style
    const pwd = process.env.PWD
    if (pwd && !pwd.includes(":")) {
      return normalizePathForSystem(pwd)
    }
  }
  
  return process.cwd()
}