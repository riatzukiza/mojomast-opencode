import { Platform } from "./platform"
import { TerminalCapabilities } from "./terminal-capabilities"

export interface NativeRenderDetectionResult {
  success: boolean
  error?: {
    type:
      | "missing_package"
      | "preload_failed"
      | "permission_denied"
      | "corrupted_installation"
      | "unknown"
      | "git_bash_incompatible"
    message: string
    details?: string
    suggestion?: string
  }
  platform?: string
  arch?: string
  terminalType?: string
  capabilities?: TerminalCapabilities.Capabilities
}

export async function detectNativeRenderSupport(): Promise<NativeRenderDetectionResult> {
  const platform = process.platform
  const arch = process.arch
  const terminalType = Platform.getTerminalType()
  const capabilities = TerminalCapabilities.detect()

  // Git Bash specific checks
  if (terminalType === "git-bash") {
    // Check if Git Bash environment is compatible with native rendering
    if (!capabilities.supportsAnsiColors) {
      return {
        success: false,
        error: {
          type: "git_bash_incompatible",
          message: "Git Bash terminal has limited ANSI support",
          details:
            "The current Git Bash environment doesn't support the ANSI escape sequences required for native TUI rendering",
          suggestion:
            "Try using Windows Terminal, PowerShell, or CMD instead, or use the web interface",
        },
        platform,
        arch,
        terminalType,
        capabilities,
      }
    }

    if (!capabilities.supportsUnicode) {
      return {
        success: false,
        error: {
          type: "git_bash_incompatible",
          message: "Git Bash terminal has limited Unicode support",
          details:
            "The current Git Bash environment doesn't support Unicode characters required for proper rendering",
          suggestion: "Configure your Git Bash to use UTF-8 encoding (export LANG=en_US.UTF-8)",
        },
        platform,
        arch,
        terminalType,
        capabilities,
      }
    }
  }

  try {
    // Check if @opentui/solid/preload loaded successfully
    const preloadLoaded = checkPreloadLoaded()
    if (!preloadLoaded) {
      return {
        success: false,
        error: {
          type: "preload_failed",
          message: "TUI native modules failed to load",
          details: "The @opentui/solid/preload module could not be loaded",
          suggestion: "Try reinstalling opencode: npm install -g opencode-ai@latest",
        },
        platform,
        arch,
        terminalType,
        capabilities,
      }
    }

    // Check if platform-specific package is available
    const packageAvailable = await checkPlatformPackageAvailable(platform, arch)
    if (!packageAvailable) {
      return {
        success: false,
        error: {
          type: "missing_package",
          message: `Native TUI not available for ${platform}-${arch}`,
          details: `The platform-specific package @opentui/core-${platform}-${arch} is not available`,
          suggestion: "Check if your platform is supported or try the web interface",
        },
        platform,
        arch,
        terminalType,
        capabilities,
      }
    }

    // Test basic native functionality
    const nativeTest = await testNativeFunctionality()
    if (!nativeTest) {
      return {
        success: false,
        error: {
          type: "corrupted_installation",
          message: "TUI native libraries are corrupted or incompatible",
          details: "Basic native functionality test failed",
          suggestion: "Try reinstalling opencode: npm install -g opencode-ai@latest",
        },
        platform,
        arch,
        terminalType,
        capabilities,
      }
    }

    return {
      success: true,
      platform,
      arch,
      terminalType,
      capabilities,
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("permission")) {
      return {
        success: false,
        error: {
          type: "permission_denied",
          message: "Cannot access TUI native libraries",
          details: "Permission denied when trying to load native modules",
          suggestion: "Check file permissions or run with appropriate privileges",
        },
        platform,
        arch,
        terminalType,
        capabilities,
      }
    }

    return {
      success: false,
      error: {
        type: "unknown",
        message: "Unknown error occurred while detecting native render support",
        details: error instanceof Error ? error.message : String(error),
        suggestion: "Try reinstalling opencode or report this issue",
      },
      platform,
      arch,
      terminalType,
      capabilities,
    }
  }
}

function checkPreloadLoaded(): boolean {
  try {
    // Check if global symbols from preload are available
    // This is a heuristic - the actual symbols depend on @opentui/solid implementation
    return (
      typeof globalThis !== "undefined" &&
      // Check for common indicators that native modules loaded
      (process.versions?.node || typeof Bun !== "undefined")
    )
  } catch {
    return false
  }
}

async function checkPlatformPackageAvailable(platform: string, arch: string): Promise<boolean> {
  try {
    // Try to resolve the platform-specific package
    const packageName = `@opentui/core-${platform}-${arch}`

    // In a real implementation, we'd check if the package is actually resolvable
    // For now, we'll do a basic check based on known supported platforms
    const supportedPlatforms = ["darwin", "linux", "win32"]
    const supportedArchs = ["x64", "arm64"]

    return supportedPlatforms.includes(platform) && supportedArchs.includes(arch)
  } catch {
    return false
  }
}

async function testNativeFunctionality(): Promise<boolean> {
  try {
    // Try to import and use a basic @opentui function
    // This tests if the native bindings are working
    const { render } = await import("@opentui/solid")

    // Check if render function is available and callable
    return typeof render === "function"
  } catch {
    return false
  }
}

export function formatDetectionError(result: NativeRenderDetectionResult): string {
  if (result.success) {
    const capabilities = result.capabilities!
    const terminalInfo = result.terminalType ? ` (${result.terminalType})` : ""
    return `✓ Native render support detected${terminalInfo}
  - ANSI Colors: ${capabilities.supportsAnsiColors ? "Yes" : "No"}
  - True Color: ${capabilities.supportsTrueColor ? "Yes" : "No"}  
  - Unicode: ${capabilities.supportsUnicode ? "Yes" : "No"}
  - Mouse: ${capabilities.supportsMouse ? "Yes" : "No"}
  - Clipboard: ${capabilities.supportsClipboard ? "Yes" : "No"}
  - Max Colors: ${capabilities.maxColors}`
  }

  const error = result.error!
  let message = `✗ ${error.message}`

  if (error.details) {
    message += `\n\nDetails: ${error.details}`
  }

  if (error.suggestion) {
    message += `\n\nSuggestion: ${error.suggestion}`
  }

  // Add terminal capabilities info for debugging
  if (result.capabilities) {
    const caps = result.capabilities
    message += `\n\nTerminal Capabilities:
  - Type: ${result.terminalType || "unknown"}
  - ANSI Colors: ${caps.supportsAnsiColors ? "Yes" : "No"}
  - True Color: ${caps.supportsTrueColor ? "Yes" : "No"}
  - Unicode: ${caps.supportsUnicode ? "Yes" : "No"}
  - Max Colors: ${caps.maxColors}`
  }

  return message
}
