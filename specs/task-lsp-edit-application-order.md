# Task: Ensure Correct Application Order Per File

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Apply per-file edits in reverse-sorted order by range start to avoid offset shifts while applying multiple edits.

Acceptance Criteria

- Deterministic order computed and used in apply pipeline.
- Unit tests cover overlapping/adjacent edits.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
