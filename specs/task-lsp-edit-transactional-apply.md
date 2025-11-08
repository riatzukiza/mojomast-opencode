# Task: Transactional Apply Wrapper

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Wrap multi-file apply in a transactional sequence: stage changes, write, and rollback if any file fails to apply.

Acceptance Criteria

- Rollback implemented and verified in tests.
- Clear user-visible success/failure messages.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
