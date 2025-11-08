# Task: Add PrepareRename and Rename Helpers

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Implement textDocument/prepareRename to validate positions and textDocument/rename to return a WorkspaceEdit for cross-file refactors.

Acceptance Criteria

- PrepareRename errors handled gracefully with clear messages.
- Rename returns WorkspaceEdit normalized to internal structure.
- Unit tests mocking multi-file rename responses.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/issues/438
