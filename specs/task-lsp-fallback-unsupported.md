# Task: Graceful Fallback for Unsupported Methods/Capabilities

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- When a server does not support a method (e.g., references, rename), return empty results and clear user messages instead of errors.

Acceptance Criteria

- Consistent behavior across all new helpers/tools.
- Unit tests that inject capability gaps.

Relevant Issues/PRs

- https://github.com/sst/opencode/issues/4003
- https://github.com/sst/opencode/pull/2708
