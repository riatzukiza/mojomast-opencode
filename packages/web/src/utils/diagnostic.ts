import type { Diagnostic } from "vscode-languageserver-types"

/**
 * Type guard to check if diagnostics are in new multi-server format
 */
export function isMultiServerFormat(
  diagnostics: Diagnostic[] | Array<{ diagnostic: Diagnostic; serverID: string }>,
): diagnostics is Array<{ diagnostic: Diagnostic; serverID: string }> {
  return diagnostics.length > 0 && "diagnostic" in diagnostics[0]
}

/**
 * Sanitize server ID for safe display in UI
 */
export function sanitizeServerID(serverID: string): string {
  if (typeof serverID !== "string") return "Unknown"

  let result = serverID

  const singleTagMatch = result.match(/^<(\w+)>$/)
  if (singleTagMatch) {
    result = singleTagMatch[1]
  } else {
    result = result.replace(/<[^>]*>/g, "")
  }

  return result
    .replace(/javascript:/gi, "") // Remove javascript protocol
    .replace(/data:/gi, "") // Remove data protocol
    .replace(/vbscript:/gi, "") // Remove vbscript protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
    .substring(0, 100) // Limit length
}

/**
 * Group diagnostics by server ID for efficient processing
 * Optimized for large datasets using Map and batch operations
 */
export function groupDiagnosticsByServer(
  diagnostics: Array<{ diagnostic: Diagnostic; serverID: string }>,
): Record<string, Diagnostic[]> {
  if (!Array.isArray(diagnostics) || diagnostics.length === 0) {
    return {}
  }

  const grouped = new Map<string, Diagnostic[]>()

  // Batch process for better performance
  for (const item of diagnostics) {
    if (!item || !item.diagnostic) continue

    const fallbackServerID =
      !item.serverID || item.serverID.trim() === "" ? "Unknown" : item.serverID
    const serverID = sanitizeServerID(fallbackServerID)
    const existing = grouped.get(serverID)

    if (existing) {
      existing.push(item.diagnostic)
    } else {
      grouped.set(serverID, [item.diagnostic])
    }
  }

  return Object.fromEntries(grouped)
}

/**
 * Filter diagnostics by severity level
 * Optimized with early validation
 */
export function filterDiagnosticsBySeverity(
  diagnostics: Array<{ diagnostic: Diagnostic; serverID: string }>,
  severity: number,
): Array<{ diagnostic: Diagnostic; serverID: string }> {
  if (!Array.isArray(diagnostics) || typeof severity !== "number") {
    return []
  }

  return diagnostics.filter(
    (item) =>
      item &&
      item.diagnostic &&
      typeof item.diagnostic.severity === "number" &&
      item.diagnostic.severity === severity,
  )
}

/**
 * Get error diagnostics (severity 1) from multi-server format
 */
export function getErrorDiagnostics(
  diagnostics: Array<{ diagnostic: Diagnostic; serverID: string }>,
): Array<{ diagnostic: Diagnostic; serverID: string }> {
  return filterDiagnosticsBySeverity(diagnostics, 1)
}
