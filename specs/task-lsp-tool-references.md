# Task: Implement LspReferencesTool

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Tool to list references for a symbol, deduped and sorted, returning file path, range, and optional snippet.

Acceptance Criteria

- Deterministic ordering (definition/local before external where sensible).
- Pagination-ready output structure.
- Unit tests on mocked results.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
