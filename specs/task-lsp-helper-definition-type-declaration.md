# Task: Add Navigation Helpers (definition/typeDefinition/declaration)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Implement LSP client helpers for textDocument/definition, textDocument/typeDefinition, and textDocument/declaration, normalizing results to a consistent internal location type.

Acceptance Criteria

- Helper functions return normalized list of locations (uri + range).
- Handles single vs multiple targets and Location vs LocationLink.
- Basic unit tests using mocked responses.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/issues/438
