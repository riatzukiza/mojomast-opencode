import { mockLSP, MockLSPService } from "./lsp-mock"

declare const jest: { mock: (module: string, factory: () => unknown) => void } | undefined

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

// Alternative approach using jest.mock if available
export function setupJestMock() {
  if (typeof jest !== "undefined") {
    jest.mock("../../src/lsp", () => ({
      diagnostics: mockLSP.diagnostics.bind(mockLSP),
      touchFile: mockLSP.touchFile.bind(mockLSP),
      Diagnostic: MockLSPService.Diagnostic,
    }))
  }
}
