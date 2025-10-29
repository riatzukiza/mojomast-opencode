import { MockLSP } from "../mocks/lsp"

// Helper to mock LSP module in tests
export function mockLSPModule() {
  const originalLSP = require("../../src/lsp")

  const mockLSP = {
    diagnostics: MockLSP.diagnostics.bind(MockLSP),
    touchFile: MockLSP.touchFile.bind(MockLSP),
    Diagnostic: MockLSP.Diagnostic,
  }

  // Replace the module
  require.cache[require.resolve("../../src/lsp")].exports = mockLSP

  return () => {
    // Restore original module
    require.cache[require.resolve("../../src/lsp")].exports = originalLSP
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
