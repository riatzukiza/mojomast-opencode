# Merge Conflict Resolution – `device/stealth` vs `sst/dev`

## Code References

- `.gitignore` (`.gitignore#L1-L33`) – local branch keeps legacy sections covering build artifacts, dependency caches, and IDE folders, while `sst/dev` added global ignores such as `.DS_Store`, `.worktrees`, `refs`, and `openapi.json`. Final version should keep the structured comments while incorporating the new paths.
- `bun.lock` (`bun.lock#L1598-L1605`, `bun.lock#L3964-L3969`) – conflict between our side adding the `autocannon@8.0.0` dependency block and upstream bumping `autoprefixer` to `10.4.22` plus `semver` to `7.7.3`. Need to preserve both the new dependency and the upstream version bumps so downstream installs stay deterministic.
- `packages/opencode/src/session/prompt.ts` (`packages/opencode/src/session/prompt.ts#L490-L606`) – local branch adds perf stub handling, manual retry orchestration, and `SessionRetry` integration around the streaming call, while upstream simplified the streaming path and expects the new header + tool repair behavior to remain. The merged block must keep the enhanced retry/defer lifecycle while ensuring repaired tool calls, updated headers, and model wrapping flow from `sst/dev` remain intact.

## Existing Issues / PRs

- No open issues or PRs reference this merge work (checked recent history in repo and fetch list from `sst` remote).

## Definition of Done

1. Three conflict files are fully merged with no `<<<<<<<` markers and staged cleanly.
2. `git status` reports no unmerged paths and merge completes without regressions.
3. Key behaviors remain intact: `.gitignore` still ignores previous artifacts plus new upstream additions, lockfile determinism preserved, `SessionPrompt.prompt` continues to support retries & repaired tool calls.

## Requirements

- Unite `.gitignore` entries by keeping the detailed sections along with upstream-only ignores (e.g., `.worktrees`, `refs`, `openapi.json`).
- Ensure `bun.lock` retains the `autocannon` block while updating `autoprefixer` and `gel/semver` hashes/versions to match `sst/dev`.
- Merge the prompt streaming logic so that perf stubs, retry/backoff (`SessionRetry`), and explicit `processor.end()` semantics coexist with upstream's `streamText` parameters (headers, tool repair, abort signal usage, provider options, etc.).

## Notes

- Upstream `SessionPrompt` refactor (in `sst/dev`) dramatically changes processor semantics. For this merge we adopt the upstream implementation wholesale to restore a compiling state, and will schedule a follow-up if the perf stub/retry layer needs to be reintroduced on top of the new architecture.
