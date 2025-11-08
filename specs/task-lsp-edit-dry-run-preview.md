# Task: Dry-Run Preview Output Format

Epic: [LSP Symbolic Editing, Refactoring, and Search](./epic-lsp-symbolic-tools.md)

SP: 2
Status: pending

Description

- Define a concise, machine- and human-readable preview of edits: per-file hunk count, line ranges, and summaries without dumping full diffs.

Acceptance Criteria

- Consistent format reused by rename and code action flows.
- Covered by unit tests for formatting edge cases.

Relevant Issues/PRs

- https://github.com/sst/opencode/pull/2708
