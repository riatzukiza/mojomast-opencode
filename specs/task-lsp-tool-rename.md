# Task: Implement LspRenameTool (with Prepare)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Tool that validates rename at position (prepareRename) and requests rename to produce a WorkspaceEdit; returns structured edit for preview/apply.

Acceptance Criteria

- PrepareRename support where available; friendly failure otherwise.
- Returns WorkspaceEdit grouped by file.
- Unit tests for multi-file rename responses.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
