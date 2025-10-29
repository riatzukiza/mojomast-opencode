import { MockLSP } from "../mocks/lsp"

// Helper to mock LSP module in tests
export function mockLSPModule() {
  const cacheKey = require.resolve("../../src/lsp")
  if (!require.cache[cacheKey]) {
    require(cacheKey)
  }

  const entry = require.cache[cacheKey]
  const originalExports = entry?.exports

  const mockLSP = {
    diagnostics: MockLSP.diagnostics.bind(MockLSP),
    touchFile: MockLSP.touchFile.bind(MockLSP),
    Diagnostic: MockLSP.Diagnostic,
  }

  if (entry) {
    entry.exports = mockLSP
  }

  return () => {
    const restoreEntry = require.cache[cacheKey]
    if (restoreEntry) {
      restoreEntry.exports = originalExports
    }
  }
}

// Helper to setup LSP with specific diagnostics for a test
export function setupLSPDiagnostics(filePath: string, diagnostics: any[]) {
  MockLSP.reset()
  MockLSP.setDiagnostics(filePath, diagnostics)
}

// Helper to setup LSP for error file
export function setupErrorFile(filePath: string) {
  MockLSP.reset()
  // The touchFile method will automatically add error diagnostics
}

// Helper to setup LSP for clean file
export function setupCleanFile(filePath: string) {
  MockLSP.reset()
  // No diagnostics for clean files
}
