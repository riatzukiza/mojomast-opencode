# Task: Define MVP Operations and Capability Detection

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Specify MVP methods: definition, references, symbols (document/workspace), rename (with prepare), code actions (edit-only). Define how to detect server capability/support and choose servers when multiple are available.

Acceptance Criteria

- Written spec for supported operations and capability checks.
- Policy for multi-server selection per file/extension.
- Error messaging guidance when capability missing.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
- https://github.com/sst/opencode/issues/4003 (optional requests MethodNotFound)
