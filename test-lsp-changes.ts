// Test file to verify LSP changes work correctly
import type { Diagnostic } from "vscode-languageserver-types"

// Test the new format
const testDiagnostics: Array<{ diagnostic: Diagnostic; serverID: string }> = [
  {
    diagnostic: {
      severity: 1,
      range: { start: { line: 1, character: 1 }, end: { line: 1, character: 2 } },
      message: "Test error",
      source: "test"
    },
    serverID: "typescript"
  },
  {
    diagnostic: {
      severity: 1,
      range: { start: { line: 2, character: 1 }, end: { line: 2, character: 2 } },
      message: "Another error",
      source: "test"
    },
    serverID: "eslint"
  }
]

// Test grouping
const grouped = testDiagnostics.reduce((acc, item) => {
  if (!acc[item.serverID]) {
    acc[item.serverID] = []
  }
  acc[item.serverID].push(item.diagnostic)
  return acc
}, {} as Record<string, Diagnostic[]>)

console.log("Grouped diagnostics:", grouped)

// Test formatDiagnosticsWithServers function
function formatDiagnosticsWithServers(diagnostics: Array<{ diagnostic: Diagnostic; serverID: string }>): string {
  if (diagnostics.length === 0) return ""

  // Group diagnostics by serverID
  const grouped = diagnostics.reduce((acc, item) => {
    if (!acc[item.serverID]) {
      acc[item.serverID] = []
    }
    acc[item.serverID].push(item.diagnostic)
    return acc
  }, {} as Record<string, Diagnostic[]>)

  const serverNames = Object.keys(grouped)
  if (serverNames.length === 1) {
    // Only one server, no need for separators
    return grouped[serverNames[0]].map(d => `${d.message}`).join("\n")
  }

  // Multiple servers, add separators
  const result: string[] = []
  for (const [serverID, serverDiagnostics] of Object.entries(grouped)) {
    if (result.length > 0) {
      result.push(`\n--- ${serverID.toUpperCase()} ---`)
    } else {
      result.push(`--- ${serverID.toUpperCase()} ---`)
    }
    result.push(...serverDiagnostics.map(d => `${d.message}`))
  }
  return result.join("\n")
}

console.log("Formatted output:")
console.log(formatDiagnosticsWithServers(testDiagnostics))