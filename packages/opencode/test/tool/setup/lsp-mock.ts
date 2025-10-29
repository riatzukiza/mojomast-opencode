import type { Diagnostic } from "vscode-languageserver-types"

// Mock LSP diagnostics data for testing
export interface MockDiagnosticData {
  [filePath: string]: Diagnostic[]
}

export class MockLSPService {
  private diagnosticsMap: MockDiagnosticData = {}
  private touchedFiles: Set<string> = new Set()

  reset() {
    this.diagnosticsMap = {}
    this.touchedFiles.clear()
  }

  setDiagnostics(filePath: string, diagnostics: Diagnostic[]) {
    this.diagnosticsMap[filePath] = diagnostics
  }

  async diagnostics(): Promise<MockDiagnosticData> {
    return this.diagnosticsMap
  }

  async touchFile(filePath: string, force = false): Promise<void> {
    this.touchedFiles.add(filePath)

    // Auto-generate diagnostics based on file content patterns
    if (filePath.includes("error") || filePath.includes("syntax")) {
      if (filePath.includes("type")) {
        this.setDiagnostics(filePath, [
          {
            range: { start: { line: 0, character: 19 }, end: { line: 0, character: 22 } },
            severity: 1,
            source: "typescript",
            message: "Type 'number' is not assignable to type 'string'.",
            code: 2322,
            codeDescription: { href: "https://typescript-eslint.io/rules/no-unsafe-assignment" },
          },
        ])
      } else if (filePath.includes("syntax")) {
        this.setDiagnostics(filePath, [
          {
            range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } },
            severity: 1,
            source: "typescript",
            message: "';' expected.",
            code: 1005,
            codeDescription: { href: "https://typescript-eslint.io/rules/semi" },
          },
        ])
      }
    } else if (filePath.includes("warning")) {
      this.setDiagnostics(filePath, [
        {
          range: { start: { line: 0, character: 8 }, end: { line: 0, character: 9 } },
          severity: 2,
          source: "typescript",
          message: "'x' is declared but its value is never read.",
          code: 6133,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unused-vars" },
        },
      ])
    } else if (filePath.includes("mixed")) {
      this.setDiagnostics(filePath, [
        {
          range: { start: { line: 0, character: 19 }, end: { line: 0, character: 22 } },
          severity: 1,
          source: "typescript",
          message: "Type 'number' is not assignable to type 'string'.",
          code: 2322,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unsafe-assignment" },
        },
        {
          range: { start: { line: 0, character: 28 }, end: { line: 0, character: 29 } },
          severity: 2,
          source: "typescript",
          message: "'y' is declared but its value is never read.",
          code: 6133,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unused-vars" },
        },
      ])
    }
    // Clean files, empty files, comment-only files get no diagnostics
  }

  getTouchedFiles(): string[] {
    return Array.from(this.touchedFiles)
  }

  static Diagnostic = {
    pretty: (diagnostic: Diagnostic): string => {
      return diagnostic.message
    },
  }
}

// Global mock instance
export const mockLSP = new MockLSPService()

// Setup function to configure mock for specific test scenarios
export function setupMockLSP(scenario: "clean" | "error" | "syntax" | "warning" | "mixed", filePath: string) {
  mockLSP.reset()

  switch (scenario) {
    case "clean":
      // No diagnostics
      break
    case "error":
      mockLSP.setDiagnostics(filePath, [
        {
          range: { start: { line: 0, character: 19 }, end: { line: 0, character: 22 } },
          severity: 1,
          source: "typescript",
          message: "Type 'number' is not assignable to type 'string'.",
          code: 2322,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unsafe-assignment" },
        },
      ])
      break
    case "syntax":
      mockLSP.setDiagnostics(filePath, [
        {
          range: { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } },
          severity: 1,
          source: "typescript",
          message: "';' expected.",
          code: 1005,
          codeDescription: { href: "https://typescript-eslint.io/rules/semi" },
        },
      ])
      break
    case "warning":
      mockLSP.setDiagnostics(filePath, [
        {
          range: { start: { line: 0, character: 8 }, end: { line: 0, character: 9 } },
          severity: 2,
          source: "typescript",
          message: "'x' is declared but its value is never read.",
          code: 6133,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unused-vars" },
        },
      ])
      break
    case "mixed":
      mockLSP.setDiagnostics(filePath, [
        {
          range: { start: { line: 0, character: 19 }, end: { line: 0, character: 22 } },
          severity: 1,
          source: "typescript",
          message: "Type 'number' is not assignable to type 'string'.",
          code: 2322,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unsafe-assignment" },
        },
        {
          range: { start: { line: 0, character: 28 }, end: { line: 0, character: 29 } },
          severity: 2,
          source: "typescript",
          message: "'y' is declared but its value is never read.",
          code: 6133,
          codeDescription: { href: "https://typescript-eslint.io/rules/no-unused-vars" },
        },
      ])
      break
  }
}
