# Task: Performance (Timeouts, Debounce/Batching, Large Edits)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Add per-request timeouts, debounce or batch workspace symbol queries, and ensure large WorkspaceEdit application remains efficient.

Acceptance Criteria

- Configurable timeouts used by helpers/tools.
- Measurable improvement in responsiveness under load.
- Unit tests simulate slow/hanging servers.

Relevant Issues/PRs

- https://github.com/sst/opencode/issues/3598 (clangd hangs)
- https://github.com/sst/opencode/issues/3628 (pyright hangs)
- https://github.com/sst/opencode/pull/2708
