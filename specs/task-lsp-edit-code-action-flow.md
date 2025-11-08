# Task: Code Action Flow (Preview + Apply)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- End-to-end support for edit-only code actions: list, preview dry-run, apply edits using the shared pipeline.

Acceptance Criteria

- Dry-run output mirrors rename flow formatting.
- Apply uses same ordering/atomic guarantees.
- Integration tests for an edit-producing action.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
