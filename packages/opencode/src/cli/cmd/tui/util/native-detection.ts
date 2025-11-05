export async function detectNativeLibrarySupport(): Promise<{ supported: boolean; error?: string; suggestions?: string[] }> {
  try {
    // Test importing the core modules
    const core = await import("@opentui/core")
    const solid = await import("@opentui/solid")
    
    // Test if we can access the render function
    if (typeof solid.render !== "function") {
      return {
        supported: false,
        error: "Render function not available in @opentui/solid",
        suggestions: [
          "Try updating your dependencies: bun install",
          "Check if your platform is supported: @opentui/core requires platform-specific native libraries",
          "Use the web UI instead: opencode web"
        ]
      }
    }

    // Test basic terminal capabilities
    if (!process.stdout.isTTY && !process.env.FORCE_TUI) {
      return {
        supported: false,
        error: "TUI requires a terminal (TTY)",
        suggestions: [
          "Run in a proper terminal environment",
          "Use FORCE_TUI=1 to override this check",
          "Use the web UI instead: opencode web"
        ]
      }
    }

    return { supported: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check for common native library issues
    if (errorMessage.includes("Cannot find module")) {
      return {
        supported: false,
        error: `Native library not found: ${errorMessage}`,
        suggestions: [
          "Install missing dependencies: bun install",
          "Check if your platform (${process.platform}-${process.arch}) is supported",
          "Try rebuilding: bun run build",
          "Use the web UI instead: opencode web"
        ]
      }
    }
    
    if (errorMessage.includes("DYLD") || errorMessage.includes("DLL")) {
      return {
        supported: false,
        error: `Native library loading failed: ${errorMessage}`,
        suggestions: [
          "Check system library dependencies",
          "Try reinstalling: bun install --force",
          "Use the web UI instead: opencode web"
        ]
      }
    }

    return {
      supported: false,
      error: `Native library error: ${errorMessage}`,
      suggestions: [
        "Check the error message above for specific issues",
        "Try updating dependencies: bun install",
        "Use the web UI instead: opencode web"
      ]
    }
  }
}

export function isNativeLibraryError(error: Error): boolean {
  return error.message && (
    error.message.includes("Cannot find module") ||
    error.message.includes("DYLD") ||
    error.message.includes("DLL") ||
    error.message.includes("@opentui") ||
    error.message.includes("native") ||
    error.message.includes("module not found")
  )
}