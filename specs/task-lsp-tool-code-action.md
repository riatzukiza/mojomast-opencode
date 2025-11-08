# Task: Implement LspCodeActionTool (Edit-Only)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Tool that fetches code actions for a range and returns actions that include edits (no executeCommand), ready for preview/apply pipelines.

Acceptance Criteria

- Returns actions with titles and their edits.
- Unit tests for edit-only actions.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
