# Task: Normalize Document Symbols

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Ensure client wrapper for textDocument/documentSymbol returns a unified format whether server returns DocumentSymbol[] or SymbolInformation[].

Acceptance Criteria

- Normalized result includes name, kind, and location range.
- Unit tests demonstrate both return shapes work.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/issues/247 (workspace symbols context)
