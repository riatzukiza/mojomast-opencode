import { getTerminalCapabilities } from "./terminal"

export function processAnsiForTerminal(text: string): string {
  const capabilities = getTerminalCapabilities()
  
  if (!capabilities.supportsAnsiSequences) {
    // Strip all ANSI sequences if not supported
    return stripAnsiSequences(text)
  }
  
  if (!capabilities.supportsTrueColor) {
    // Convert truecolor sequences to 256-color or 16-color equivalents
    text = convertTrueColorTo256Color(text)
  }
  
  // Git Bash specific processing
  if (capabilities.pasteBehavior === "limited") {
    text = handleGitBashAnsiCompatibility(text)
  }
  
  return text
}

function stripAnsiSequences(text: string): string {
  // Remove ANSI escape sequences
  return text.replace(/\x1b\[[0-9;]*[mGKHfJABCDsuPL]/g, "")
}

function convertTrueColorTo256Color(text: string): string {
  // Convert RGB colors (38;2;r;g;b) to 256-color approximation
  return text.replace(/\x1b\[38;2;(\d+);(\d+);(\d+)m/g, (match, r, g, b) => {
    const rNum = parseInt(r)
    const gNum = parseInt(g)
    const bNum = parseInt(b)
    
    // Convert RGB to 256-color
    const colorIndex = rgbTo256(rNum, gNum, bNum)
    return `\x1b[38;5;${colorIndex}m`
  })
}

function rgbTo256(r: number, g: number, b: number): number {
  // Simple RGB to 256-color conversion
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return Math.round(((r - 8) / 247) * 24) + 232
  }
  
  return 16 + (36 * Math.round(r / 255 * 5)) + 
         (6 * Math.round(g / 255 * 5)) + 
         Math.round(b / 255 * 5)
}

function handleGitBashAnsiCompatibility(text: string): string {
  // Handle specific ANSI sequences that may be problematic in Git Bash
  
  // Replace some potentially problematic sequences with safer alternatives
  text = text.replace(/\x1b\[?1034h/g, "") // Remove problematic mode settings
  text = text.replace(/\x1b\[?1h/g, "")   // Remove cursor key mode
  text = text.replace(/\x1b\[?7l/g, "")    // Remove wrap mode off
  
  // Ensure bracketed paste mode is properly handled
  text = text.replace(/\x1b\[?2004h/g, "") // Remove bracketed paste mode start
  text = text.replace(/\x1b\[?2004l/g, "") // Remove bracketed paste mode end
  
  return text
}

export function sanitizeTextForTerminal(text: string): string {
  // Remove or replace characters that may cause issues in Git Bash
  return text
    .replace(/\r\n/g, "\n")  // Normalize line endings
    .replace(/\r/g, "\n")    // Convert Mac line endings
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
}

export function enhanceAnsiForGitBash(text: string): string {
  const capabilities = getTerminalCapabilities()
  
  if (capabilities.pasteBehavior !== "limited") {
    return text
  }
  
  // Add explicit resets after color changes to prevent bleeding
  return text.replace(/\x1b\[[0-9;]*m/g, (match) => match + "\x1b[0m")
}