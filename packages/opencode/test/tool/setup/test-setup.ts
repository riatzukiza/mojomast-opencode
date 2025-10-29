import { mockLSP, setupMockLSP, MockLSPService } from "./lsp-mock"

// Mock the LSP module at the test level
export function mockLSPModule() {
  const Module = require("module")
  const originalRequire = Module.prototype.require

  Module.prototype.require = function (id: string) {
    if (id === "../lsp" || id.endsWith("/lsp")) {
      return {
        diagnostics: mockLSP.diagnostics.bind(mockLSP),
        touchFile: mockLSP.touchFile.bind(mockLSP),
        Diagnostic: MockLSPService.Diagnostic,
      }
    }
    return originalRequire.apply(this, arguments)
  }

  return () => {
    Module.prototype.require = originalRequire
  }
}

// Note: jest.mock not available in bun test environment
