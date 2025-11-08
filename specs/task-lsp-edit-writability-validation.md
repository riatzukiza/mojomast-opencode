# Task: Validate Writability and Sandbox Constraints

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 1
Status: pending

Description

- Before applying edits, ensure target files exist, are within writable roots, and satisfy permission model.

Acceptance Criteria

- Apply fails fast with clear message when file not writable.
- Unit tests simulate blocked writes.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
