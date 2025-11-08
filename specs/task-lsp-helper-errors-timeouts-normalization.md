# Task: Shared Error/Timeout Handling and Normalization Utilities

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Provide shared utilities for request timeouts, capability checks, and consistent normalization of LSP responses.

Acceptance Criteria

- Timeout wrapper used by all new helpers.
- Capability missing returns empty results and friendly errors.
- Unit tests cover timeout path.

Relevant Issues/PRs

- https://github.com/sst/opencode/issues/4003 (optional requests handling)
- https://github.com/sst/opencode/pull/2708
