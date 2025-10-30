import type { Diagnostic } from "vscode-languageserver-types"

export const mockDiagnostics = {
  // Type error diagnostic
  typeError: {
    range: {
      start: { line: 0, character: 19 },
      end: { line: 0, character: 22 },
    },
    severity: 1, // Error
    source: "typescript",
    message: "Type 'number' is not assignable to type 'string'.",
    code: 2322,
    codeDescription: {
      href: "https://typescript-eslint.io/rules/no-unsafe-assignment",
    },
  } as Diagnostic,

  // Syntax error diagnostic
  syntaxError: {
    range: {
      start: { line: 1, character: 0 },
      end: { line: 1, character: 1 },
    },
    severity: 1, // Error
    source: "typescript",
    message: "';' expected.",
    code: 1005,
    codeDescription: {
      href: "https://typescript-eslint.io/rules/semi",
    },
  } as Diagnostic,

  // Warning diagnostic
  warning: {
    range: {
      start: { line: 0, character: 8 },
      end: { line: 0, character: 9 },
    },
    severity: 2, // Warning
    source: "typescript",
    message: "'x' is declared but its value is never read.",
    code: 6133,
    codeDescription: {
      href: "https://typescript-eslint.io/rules/no-unused-vars",
    },
  } as Diagnostic,

  // Information diagnostic
  info: {
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 15 },
    },
    severity: 3, // Information
    source: "typescript",
    message: "File is a module.",
    code: 2306,
    codeDescription: {
      href: "https://typescript-eslint.io/rules/no-implicit-any",
    },
  } as Diagnostic,
}

export const expectedDiagnosticOutputs = {
  typeError: "Type 'number' is not assignable to type 'string'.",
  syntaxError: "';' expected.",
  warning: "'x' is declared but its value is never read.",
  info: "File is a module.",
}

export const createMockDiagnosticsMap = (filePath: string, diagnostics: Diagnostic[]) => {
  return {
    [filePath]: diagnostics,
  }
}
