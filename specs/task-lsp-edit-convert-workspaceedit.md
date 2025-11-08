# Task: Convert WorkspaceEdit/TextEdit to Internal Patch Format

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Translate LSP WorkspaceEdit/TextEdit into per-file patch structures compatible with existing patch/multiedit tools for atomic application.

Acceptance Criteria

- Conversion groups edits per file with correct ranges and text.
- Handles both changes and documentChanges variants.
- Unit tests for single/multi-file cases.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
