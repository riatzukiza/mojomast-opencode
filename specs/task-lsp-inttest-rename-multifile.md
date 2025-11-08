# Task: Integration Test – Rename (Multi-File)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- End-to-end rename producing edits in multiple files; verify dry-run summary and atomic apply behavior.

Acceptance Criteria

- Dry-run shows expected files and ranges; successful apply modifies all files.
- Failure triggers rollback (no partial writes).

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
