# Task: Conflict Detection with Unsaved/Concurrent Changes

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Detect when target files diverge since symbol resolution; fail with guidance instead of partially applying conflicting edits.

Acceptance Criteria

- Detect staleness via file timestamps or content hash.
- Friendly error instructs to retry after refreshing context.
- Unit tests simulate concurrent modification.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
