# Task: Inventory Current LSP Capabilities and Gaps

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Review existing LSP integration to document supported methods (hover, diagnostics, symbols) and identify missing ones needed for symbolic navigation/refactor/search.

Acceptance Criteria

- Document lists current LSP client/server features and gaps in repo.
- Confirms workspace/document symbol support and notes /find/symbol API is disabled.
- Notes absence of definition/references/rename/codeAction helpers/tools.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708 (Expose LSP API)
- https://github.com/sst/opencode/issues/438 (more LSP)
