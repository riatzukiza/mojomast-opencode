# Task: Implement LspSymbolsTool (Document/Workspace)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Tool that returns document symbols for a file and workspace symbols for a query, normalized.

Acceptance Criteria

- Document: returns name, kind, location range.
- Workspace: honors filter and limit; kinds aligned with epic.
- Unit tests for both.

Relevant Issues/PRs

- https://github.com/sst/opencode/issues/247
- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/pull/36 (LSP symbols in completion)
