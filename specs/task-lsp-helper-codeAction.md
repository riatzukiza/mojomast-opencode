# Task: Add Code Action Helper (textDocument/codeAction)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Implement helper for textDocument/codeAction focusing on actions that include edits (no executeCommand handling initially). Collect any WorkspaceEdit from results.

Acceptance Criteria

- Returns list of actions with title and edit payload where available.
- Unit tests for edit-only actions.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/issues/438
