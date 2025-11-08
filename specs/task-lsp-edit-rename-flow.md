# Task: Rename Flow (Preview + Apply, Atomic)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Implement end-to-end rename: call prepare/rename, present dry-run preview, apply atomically across files.

Acceptance Criteria

- Dry-run includes per-file changes summary (counts, ranges).
- Apply is all-or-nothing; rollback on failure.
- Integration tests on sample project.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
