import { platform, arch } from "node:os"
import { existsSync } from "node:fs"
import { join } from "node:path"

interface NativeLibraryDetectionResult {
  success: boolean
  error?: string
  suggestions?: string[]
}

export async function detectNativeRenderLibrary(): Promise<NativeLibraryDetectionResult> {
  try {
    // Test importing the core modules
    const coreModule = await import("@opentui/core")
    const solidModule = await import("@opentui/solid")
    
    // Verify required functions exist
    if (!solidModule.render || typeof solidModule.render !== "function") {
      return {
        success: false,
        error: "Render function not available in @opentui/solid",
        suggestions: [
          "Try rebuilding the application: bun run build",
          "Check if the correct platform-specific package is installed",
          "Verify your system architecture is supported"
        ]
      }
    }

    // Test basic functionality without actually starting the renderer
    if (!coreModule.TextAttributes || !coreModule.RGBA) {
      return {
        success: false,
        error: "Required types not available in @opentui/core",
        suggestions: [
          "The native library may be corrupted",
          "Try reinstalling dependencies: bun install"
        ]
      }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Determine specific error type and provide targeted suggestions
    if (errorMessage.includes("Cannot find module")) {
      const os = platform()
      const cpuArch = arch()
      const expectedPackage = `@opentui/core-${os === "windows" ? "win32" : os}-${cpuArch.replace("-baseline", "")}`
      
      return {
        success: false,
        error: `Native render library not found: ${errorMessage}`,
        suggestions: [
          `Platform-specific package missing: ${expectedPackage}`,
          "Run the build script to download native binaries: bun run build",
          "Ensure your platform (${os}-${cpuArch}) is supported",
          "Try manually installing the platform-specific package"
        ]
      }
    }
    
    if (errorMessage.includes("Module not found") || errorMessage.includes("ENOENT")) {
      return {
        success: false,
        error: `Native library files missing: ${errorMessage}`,
        suggestions: [
          "Native binaries may not have been downloaded during build",
          "Run: bun run build to download platform-specific binaries",
          "Check if the build process completed successfully"
        ]
      }
    }
    
    if (errorMessage.includes("dylib") || errorMessage.includes("dll") || errorMessage.includes("so")) {
      return {
        success: false,
        error: `Native library loading failed: ${errorMessage}`,
        suggestions: [
          "System architecture mismatch detected",
          "Try rebuilding for your specific architecture",
          "Check if required system libraries are installed",
          "On Linux: ensure glibc version is compatible"
        ]
      }
    }

    return {
      success: false,
      error: `Unexpected error loading native library: ${errorMessage}`,
      suggestions: [
        "Check the build logs for any errors during native compilation",
        "Try cleaning and rebuilding: rm -rf node_modules && bun install && bun run build",
        "Report this issue if it persists after rebuilding"
      ]
    }
  }
}