# Task: Multi-Server Routing Policy

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 3
Status: pending

Description

- Define and implement selection of appropriate LSP client per file/language when multiple servers could handle a request. Consider extension matching, root, and capability.

Acceptance Criteria

- Policy documented and enforced in helpers/tools.
- Unit tests simulate overlapping servers.

Relevant Issues/PRs

- https://github.com/sst/opencode/issues/4003
- https://github.com/sst/opencode/pull/2975
- https://github.com/sst/opencode/pull/2708
