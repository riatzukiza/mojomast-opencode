import type { Diagnostic } from "vscode-languageserver-types"
import { mockDiagnostics, createMockDiagnosticsMap } from "./diagnostics"

export class MockLSP {
  private static diagnosticsMap: Record<string, Diagnostic[]> = {}
  private static touchedFiles: Set<string> = new Set()

  static reset() {
    this.diagnosticsMap = {}
    this.touchedFiles.clear()
  }

  static setDiagnostics(filePath: string, diagnostics: Diagnostic[]) {
    this.diagnosticsMap[filePath] = diagnostics
  }

  static async diagnostics() {
    return this.diagnosticsMap
  }

  static async touchFile(filePath: string, force = false) {
    this.touchedFiles.add(filePath)

    // Simulate LSP behavior - add diagnostics for known error patterns
    if (filePath.includes("error") || filePath.includes("syntax")) {
      if (filePath.includes("type")) {
        this.setDiagnostics(filePath, [mockDiagnostics.typeError])
      } else if (filePath.includes("syntax")) {
        this.setDiagnostics(filePath, [mockDiagnostics.syntaxError])
      } else {
        this.setDiagnostics(filePath, [mockDiagnostics.typeError])
      }
    } else if (filePath.includes("warning")) {
      this.setDiagnostics(filePath, [mockDiagnostics.warning])
    } else if (filePath.includes("info")) {
      this.setDiagnostics(filePath, [mockDiagnostics.info])
    }
    // Clean files get no diagnostics
  }

  static getTouchedFiles(): string[] {
    return Array.from(this.touchedFiles)
  }

  static Diagnostic = {
    pretty: (diagnostic: Diagnostic): string => {
      return `${diagnostic.message}`
    },
  }
}
