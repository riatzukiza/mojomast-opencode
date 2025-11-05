/**
 * Filter out OSC (Operating System Command) sequences and other terminal escape codes
 * that might appear as stray text in the UI
 */

// OSC pattern: \x1b] ... \x07 or \x1b] ... \x1b\
const OSC_PATTERN = /\x1b\][^\x07\x1b]*[\x07\x1b\\]/g

// Other common terminal escape sequences that might appear as stray text
const ESCAPE_PATTERNS = [
  /\x1b\][^\x07\x1b]*[\x07\x1b\\]/g, // OSC sequences
  /\x1bP[^\x1b]*\x1b\\/g,             // DCS sequences
  /\x1b\][0-9]+;[^\x07\x1b]*[\x07\x1b\\]/g, // OSC with parameters
  /\x1b\][\x07\x1b\\]/g,              // Empty OSC
]

/**
 * Filter OSC and other terminal escape sequences from text
 */
export function filterOSCPayloads(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  let filtered = text
  
  // Remove all OSC and related escape sequences
  for (const pattern of ESCAPE_PATTERNS) {
    filtered = filtered.replace(pattern, '')
  }
  
  return filtered
}

/**
 * Check if a string contains only OSC/escape sequences (no visible content)
 */
export function isOnlyOSCPayloads(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }
  
  const filtered = filterOSCPayloads(text)
  const trimmed = filtered.trim()
  
  // If after filtering, nothing remains or only whitespace, it was only OSC payloads
  return trimmed.length === 0
}

/**
 * Safe wrapper for process.stdout.write that filters OSC payloads
 */
export function safeStdoutWrite(text: string): void {
  const filtered = filterOSCPayloads(text)
  if (filtered.length > 0) {
    process.stdout.write(filtered)
  }
}

/**
 * Safe wrapper for process.stderr.write that filters OSC payloads  
 */
export function safeStderrWrite(text: string): void {
  const filtered = filterOSCPayloads(text)
  if (filtered.length > 0) {
    process.stderr.write(filtered)
  }
}