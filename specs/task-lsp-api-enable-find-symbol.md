# Task: Re-enable /find/symbol Server API

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Wire server route /find/symbol to LSP.workspaceSymbol with capability gating; fallback to [] when unsupported or no active clients.

Acceptance Criteria

- Endpoint returns filtered/limited symbols as defined in epic.
- Integration test covers supported and unsupported cases.

Relevant Issues/PRs

- https://github.com/sst/opencode/issues/247
- https://github.com/sst/opencode/pull/2708
