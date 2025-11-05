import { Platform } from "./platform"

export namespace TerminalCapabilities {
  export interface Capabilities {
    supportsAnsiColors: boolean
    supportsTrueColor: boolean
    supportsUnicode: boolean
    supportsMouse: boolean
    supportsClipboard: boolean
    maxColors: number
    terminalType: string
  }

  export function detect(): Capabilities {
    const terminalType = Platform.getTerminalType()

    return {
      supportsAnsiColors: detectAnsiColorSupport(),
      supportsTrueColor: detectTrueColorSupport(),
      supportsUnicode: Platform.shouldUseUnicode(),
      supportsMouse: detectMouseSupport(),
      supportsClipboard: detectClipboardSupport(),
      maxColors: detectMaxColors(),
      terminalType,
    }
  }

  function detectAnsiColorSupport(): boolean {
    if (!Platform.shouldUseAnsiColors()) return false

    // Check environment variables for color support
    const term = process.env.TERM || ""
    const colorterm = process.env.COLORTERM || ""

    if (colorterm.includes("truecolor") || colorterm.includes("24bit")) {
      return true
    }

    if (term.includes("color") || term.includes("256") || term.includes("xterm")) {
      return true
    }

    // Git Bash fallback
    if (Platform.isGitBash()) {
      return process.env.TERM !== "dumb"
    }

    return false
  }

  function detectTrueColorSupport(): boolean {
    if (!detectAnsiColorSupport()) return false

    const colorterm = process.env.COLORTERM || ""
    const term = process.env.TERM || ""

    return (
      colorterm.includes("truecolor") ||
      colorterm.includes("24bit") ||
      term.includes("truecolor") ||
      term.includes("24bit")
    )
  }

  function detectMouseSupport(): boolean {
    const term = process.env.TERM || ""

    // Most modern terminals support mouse
    if (term.includes("xterm") || term.includes("screen") || term.includes("tmux")) {
      return true
    }

    // Git Bash may have limited mouse support
    if (Platform.isGitBash()) {
      return false // Conservative approach for Git Bash
    }

    return Platform.isWindows() // Windows terminals generally support mouse
  }

  function detectClipboardSupport(): boolean {
    const terminalType = Platform.getTerminalType()

    // Windows Terminal has good clipboard support
    if (terminalType === "windows-terminal") return true

    // Git Bash has limited clipboard support via OSC52
    if (terminalType === "git-bash") {
      return false // Disable clipboard features for Git Bash
    }

    // PowerShell and CMD have clipboard support
    if (terminalType === "powershell" || terminalType === "cmd") return true

    return false
  }

  function detectMaxColors(): number {
    if (!detectAnsiColorSupport()) return 0

    const colorterm = process.env.COLORTERM || ""
    const term = process.env.TERM || ""

    if (colorterm.includes("truecolor") || colorterm.includes("24bit")) {
      return 16777216 // 24-bit color
    }

    if (term.includes("256color")) {
      return 256
    }

    if (term.includes("color")) {
      return 16
    }

    // Git Bash fallback
    if (Platform.isGitBash()) {
      return 16 // Conservative color count for Git Bash
    }

    return 8
  }

  export function shouldUseSimplifiedRendering(): boolean {
    const capabilities = detect()
    const terminalType = Platform.getTerminalType()

    // Use simplified rendering for Git Bash or limited terminals
    if (terminalType === "git-bash") {
      return !capabilities.supportsTrueColor || !capabilities.supportsUnicode
    }

    return !capabilities.supportsAnsiColors || capabilities.maxColors < 16
  }

  export function getOptimalColorPalette(): string[] {
    const capabilities = detect()

    if (!capabilities.supportsAnsiColors) {
      return [] // No colors
    }

    if (capabilities.supportsTrueColor) {
      return [] // Use truecolor
    }

    if (capabilities.maxColors >= 256) {
      return get256ColorPalette()
    }

    if (capabilities.maxColors >= 16) {
      return get16ColorPalette()
    }

    return get8ColorPalette()
  }

  function get256ColorPalette(): string[] {
    // Return a subset of 256 colors for compatibility
    return [
      "#000000",
      "#800000",
      "#008000",
      "#808000",
      "#000080",
      "#800080",
      "#008080",
      "#c0c0c0",
      "#808080",
      "#ff0000",
      "#00ff00",
      "#ffff00",
      "#0000ff",
      "#ff00ff",
      "#00ffff",
      "#ffffff",
      // Additional colors can be added as needed
    ]
  }

  function get16ColorPalette(): string[] {
    return [
      "#000000",
      "#800000",
      "#008000",
      "#808000",
      "#000080",
      "#800080",
      "#008080",
      "#c0c0c0",
      "#808080",
      "#ff0000",
      "#00ff00",
      "#ffff00",
      "#0000ff",
      "#ff00ff",
      "#00ffff",
      "#ffffff",
    ]
  }

  function get8ColorPalette(): string[] {
    return ["#000000", "#800000", "#008000", "#800000", "#000080", "#800080", "#008080", "#c0c0c0"]
  }
}
