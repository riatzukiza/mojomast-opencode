import { describe, it, expect } from "bun:test"
import { Platform } from "@/util/platform"
import { TerminalCapabilities } from "@/util/terminal-capabilities"

describe("Platform Detection", () => {
  it("should detect Windows platform", () => {
    // Mock process.platform
    const originalPlatform = process.platform
    ;(process as any).platform = "win32"

    expect(Platform.isWindows()).toBe(true)

    // Restore
    ;(process as any).platform = originalPlatform
  })

  it("should detect Git Bash environment", () => {
    const originalEnv = process.env

    // Mock Git Bash environment
    process.env = {
      ...originalEnv,
      SHELL: "/usr/bin/bash",
      MSYSTEM: "MINGW64",
      TERM: "xterm-256color",
    }

    expect(Platform.isGitBash()).toBe(true)
    expect(Platform.getTerminalType()).toBe("git-bash")

    // Restore
    process.env = originalEnv
  })

  it("should normalize Windows paths for Git Bash", () => {
    const originalPlatform = process.platform
    const originalEnv = process.env

    ;(process as any).platform = "win32"
    process.env = {
      ...originalEnv,
      MSYSTEM: "MINGW64",
    }

    const windowsPath = "C:\\Users\\test\\file.txt"
    const normalized = Platform.normalizePath(windowsPath)

    expect(normalized).toBe("/c/Users/test/file.txt")

    // Restore
    ;(process as any).platform = originalPlatform
    process.env = originalEnv
  })
})

describe("Terminal Capabilities", () => {
  it("should detect Git Bash capabilities", () => {
    const originalPlatform = process.platform
    const originalEnv = process.env

    ;(process as any).platform = "win32"
    process.env = {
      ...originalEnv,
      MSYSTEM: "MINGW64",
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
    }

    const capabilities = TerminalCapabilities.detect()

    expect(capabilities.terminalType).toBe("git-bash")
    expect(capabilities.supportsAnsiColors).toBe(true)
    expect(capabilities.supportsUnicode).toBe(true)

    // Restore
    ;(process as any).platform = originalPlatform
    process.env = originalEnv
  })

  it("should recommend simplified rendering for limited terminals", () => {
    const originalPlatform = process.platform
    const originalEnv = process.env

    ;(process as any).platform = "win32"
    process.env = {
      ...originalEnv,
      MSYSTEM: "MINGW64",
      TERM: "dumb", // Limited terminal
    }

    const shouldSimplify = TerminalCapabilities.shouldUseSimplifiedRendering()
    expect(shouldSimplify).toBe(true)

    // Restore
    ;(process as any).platform = originalPlatform
    process.env = originalEnv
  })
})
