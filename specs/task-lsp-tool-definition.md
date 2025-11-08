# Task: Implement LspDefinitionTool

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Tool to resolve symbol definition(s) from a file+position and return primary target and any additional targets.

Acceptance Criteria

- Returns normalized locations; primary target first.
- Handles multiple LSP clients gracefully.
- Unit tests for single/multiple results.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
