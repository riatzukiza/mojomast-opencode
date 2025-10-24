# Token usage accounting cross-UI diagnostic

Date: 2025-10-23
Author: OpenCode Diagnostics Agent

## Executive summary

- Two interfaces report token usage differently: Web UI aggregates tokens across all assistant messages in a session; TUI reports tokens for the current/last interaction (with compaction logic). Both reflect aspects of real usage but diverge due to prompt assembly, history handling, and UI goals.
- The discrepancy arises from how the session context is constructed and how token costs are calculated and surfaced. The Web view aligns with total input tokens sent to the provider; the TUI view reflects the per-turn marginal tokens after compaction.
- A single source of truth is preferred for budgeting and UX, requiring alignment of both token counting and context window accounting across the stack (frontend Web, TUI, and backend prompt assembly).

---

## Objective

Determine: (1) how many tokens are actually sent to the model on each turn; (2) how providers compute costs; (3) how cached tokens are treated; (4) whether TUI's current token accounting is correct; (5) whether either display is correct, and (6) how to present these metrics coherently to users.

---

## Evidence sources (code & data paths)

- TUI token calculation (compaction logic)
  - File: packages/tui/internal/components/chat/messages.go
  - Relevant snippet:
    - Accumulation/assignment logic for tokens uses an assignment pattern (tokens = ...), effectively capturing only the last message with tokens unless Summary toggles occur.
    - References to Cache.Read, Cache.Write, and Reasoning as components of tokens for non-summary messages.
- Web token calculation (accumulation across messages)
  - File: packages/web/src/components/Share.tsx
  - Relevant snippet:
    - result.tokens.input += msg.tokens.input
    - result.tokens.output += msg.tokens.output
    - result.tokens.reasoning += msg.tokens.reasoning
- Backend data model and data flow
  - File: packages/function/src/api.ts
  - Endpoint: GET /share_data reads per-session stored messages and parts
  - Data path: store → share_data → Share.tsx uses messages to populate UI
  - Observations:
    - share_data returns { info, messages } scoped to a single session; it is not cross-session data; data is collected from storage keys starting with session/ and grouped by sessionID.

- Context and prompt construction (where tokens actually get consumed)
  - Although not all code paths are present in this quick scan, evidence suggests the actual API payload for the LLM is assembled from the per-session messages (human/assistant) plus potential summaries.
  - A full understanding requires tracing the exact call that builds the prompt for the LLM (client-facing requests from the frontend to the server, then to the model).

---

## Findings

1. Context scope per turn

- The Web UI sums tokens from all assistant messages in a given session (accumulating across history). This aligns with the full number of input tokens sent across API calls if the prompt at each turn includes the entire conversation (or a panel that includes all prior turns).
- The TUI uses an assignment per turn for tokens and appears to cap at the last/most-recent assistant message unless a Summary condition prevents it. This yields a marginal token figure per user interaction, not a cumulative total.

2. What tokens represent

- input tokens: tokens consumed by the model for the user/system prompts (and possibly content included in the prompt).
- output tokens: tokens produced by the model in reply.
- reasoning tokens, cache reads/writes: internal accounting components that contribute to the cost, especially for the assistant's internal chain-of-thought or cache usage.

3. Are cached tokens handled correctly?

- There is a notion of Cache.Read and Cache.Write in TUI's accounting, which suggests some tokens are accounted for cache interactions. Whether the provider charges for cached content depends on how the prompt is constructed and whether cache reduces actual prompt length. The current Web view aggregates all reported tokens, but there is no explicit evidence in the quick scan of how cache tokens map to API calls.

4. Is the TUI calculation correct?

- The TUI calculation appears to reflect marginal tokens for the currently active compaction window rather than the total session usage. From a budgeting perspective, this undercounts total usage and costs incurred per session.
- If the intended UX is to show the amount of tokens in the current context (before the next call), then a more accurate model would be to accumulate across all messages included in the actual prompt for the next API call, which is the total context size.

5. Could both numbers be right in different contexts?

- Yes. The Web number reflects the total tokens actually sent across the entire session so far; the TUI number reflects the tokens associated with the current context window for the next request, which can differ if many turns have been compacted or summarized.

6. Is this a UX issue or a data-model issue?

- Part UX, part data-model. Users expect cost budgeting tools to reflect actual costs, which implies total session tokens. However, showing a per-turn context size is also useful for understanding the current prompt payload and model context window health.

---

## Plan to resolve and align metrics

1. Establish a canonical metric set

- Canonical total_session_input_tokens and total_session_cost (what the provider would charge for the entire session so far).
- Per-turn context_tokens_for_next_call (the token count that will be sent in the next API request).
- Optional: per-turn deltas (tokens used for the last turn only).

2. Implement alignment across UI components

- Update TUI accounting to accumulate tokens across all messages included in the actual prompt for the next request. This includes all non-compact content that is actually sent to the model on each turn.
- In Web, continue to show total session metrics but ensure terminology matches the canonical metrics used by the model prompt builder.
- If there is a Summary mechanism that replaces content in the prompt for cost purposes, reflect that in the canonical model and ensure both UIs derive their numbers from the same prompt payload.

3. Instrumentation tests

- Add unit tests for token accounting functions in both TUI and Web to verify accumulation across session history and consistent handling of Summary cases.
- Add integration tests with a mock LLM to validate the mapping from stored messages to model payloads and to ensure the observed costs align with the payload sent.

4. UX and documentation updates

- UI panels labeled clearly: "Total session input tokens" and "Context for next call" (or similar).
- Document the definitions of input, output, and reasoning tokens, and how Cache Read/Write contribute to costs.
- Create a migration note for users describing why numbers may change and what they mean.

5. Rollout and risk assessment

- Plan phased rollout with a parallel display (two numbers) for a couple of releases, then remove the old display after user validation.
- Monitor dashboards and error rates to ensure no regressions in token accounting metrics.

---

## Risks and mitigations

- Risk: Confusion during transition when both numbers diverge temporarily.
  Mitigation: Show a clear explanation in a help panel; provide a toggle to switch between two modes during transition.
- Risk: Misalignment between the actual API prompt payload and the metrics surfaced in UI.
  Mitigation: Tie the canonical metrics directly to the prompt builder; add tests that reconcile with mocked API calls.
- Risk: Big changes may affect dashboards and logging.
  Mitigation: Run a non-breaking pilot on a staging branch, with explicit migration notes.

---

## Next steps (concrete actions)

- [ ] Create a canonical token accounting module that computes:
  - total_session_input_tokens
  - total_session_cost
  - context_tokens_for_next_call
- [ ] Refactor TUI accounting to accumulate per-message tokens across the actual prompt payload, preserving the ability to show per-turn deltas if needed.
- [ ] Adjust Web UI labels to reference canonical metrics and keep a per-turn drill-down.
- [ ] Implement unit tests for both UIs that compare their counts against a mocked provider payload.
- [ ] Add a reconciliation test that simulates a long session with multiple summaries and verifies consistency.
- [ ] Update docs with a glossary of token counting terms and a user guide for the new metrics.
- [ ] Prepare a PR with code diffs, tests, and docs.

---

## Questions for alignment

- Do you want to keep a separate per-turn delta display, or consolidate everything into a single total with an optional drill-down per turn?
- Should we treat Summary as part of the canonical prompt payload (i.e., the model should see the summarized content for cost accounting) or as display-only metadata?
- Are there dashboards or external monitoring constraints we should preserve during the migration?

If you’d like, I can proceed to implement the changes, add tests, and prepare a PR with a detailed description and diffs.
