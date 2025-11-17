# Session Resume Delay Investigation

## Context

- Multiple engineers have reported that some prompts start streaming immediately, while others sit in a "waiting to resume" state for noticeable periods.
- The opencode runtime processes a wide range of housekeeping work before an assistant model can stream tokens; those preconditions only trigger in particular situations (queueing, compaction, generated subtasks, large file attachments, retries, etc.).
- This document captures the relevant code paths and requirements for diagnosing that latency so we can scope fixes or UX messaging.

## Code References

1. `packages/opencode/src/session/prompt.ts:225-595` – `SessionPrompt.loop` owns orchestration for each session; it serializes work per session, drains queued callbacks, and branches into subtasks/compaction before model streaming.
2. `packages/opencode/src/session/prompt.ts:245-385` – The loop first executes any pending `compaction` or `subtask` parts (TaskTool executions), which can block new user prompts until they finish.
3. `packages/opencode/src/session/compaction.ts:31-112` – Context overflow detection triggers automatic compaction jobs that request extra LLM summarization before normal replies.
4. `packages/opencode/src/session/prompt.ts:798-998` – `createUserMessage` resolves @file/@directory references by invoking `ReadTool`/`ListTool`, which performs synchronous file IO and LSP lookups before the session loop restarts.
5. `packages/opencode/src/session/processor.ts:42-337` – The processor drives streaming, sets `SessionStatus` to `busy`, and can schedule exponential backoffs (`SessionRetry`) on retryable API errors, delaying the next attempt.
6. `packages/opencode/src/session/status.ts:60-74` – Status transitions power the TUI/CLI resume indicator; stalled states stay `busy` or `retry` until long-running work exits.

## Existing Issues

- #49 "Compaction: Structured BUILD-mode handoff summary prompt" (opened 2025-11-09) – touches the same compaction subsystem that adds pre-response work; improvements there may reduce perceived delays.
- No other open issues mention "session resume" (searched via `gh issue list -S "session resume"`).

## Existing PRs

- No active PRs mention "session resume" (checked with `gh pr list -S "session resume"`).

## Requirements

1. Catalog every code path that can block `SessionPrompt.loop` before a new assistant turn begins, referencing file/line numbers for future remediation.
2. Distinguish which blockers are user-triggered (e.g., @file expansions, manual subtasks) versus automatic (e.g., compaction, retries) so UX messaging can be tailored.
3. Propose instrumentation or UX hooks (e.g., exposing `SessionStatus` reasons) that would let the CLI explain why it is waiting.

## Definition of Done

- Documented at least three distinct delay sources with concrete code references and triggering conditions.
- Captured linkage between those sources and current issue/PR state.
- Delivered actionable follow-up recommendations (instrumentation or UX notes) to guide future implementation work.
- Shared findings back to the requestor (chat response) referencing this spec.

## Notes / Next Steps

- Consider emitting finer-grained `SessionStatus` payloads (e.g., `status: { type: "busy", reason: "compaction" }`) inside each branch in `SessionPrompt.loop` so the TUI can show the cause of waiting.
- Collect timing metrics around `createUserMessage` file expansions and `SessionProcessor` retry loops to validate which source dominates the observed delays.
