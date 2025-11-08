# Task: Add References Helper (textDocument/references)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Implement client helper for textDocument/references with options (includeDeclaration). Dedupe and sort results by file and position.

Acceptance Criteria

- Returns unique references with stable ordering.
- Supports includeDeclaration flag.
- Unit tests with mocked responses.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/issues/438
