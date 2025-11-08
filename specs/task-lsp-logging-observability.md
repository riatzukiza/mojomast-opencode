# Task: Logging and Observability for LSP Requests and Edits

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Add Log.create calls around LSP requests and the edit application pipeline; provide concise, useful logs without noise.

Acceptance Criteria

- Logs include request type, latency, result count, and failures.
- Toggle verbosity via config.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2364 (log enabled lsps)
- https://github.com/sst/opencode/pull/2708
