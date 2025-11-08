# Task: Navigation Output Prioritization (Jump-to-Definition)

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- When multiple definition targets are returned, choose primary target consistently (same file proximity, non-declaration first), with others listed.

Acceptance Criteria

- Deterministic priority logic documented and implemented.
- Unit tests exercising multiple-target scenarios.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
