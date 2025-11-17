# Perf Suite Plan – Chat Loop

## Scope & Scenario

- Focus on the **main chat loop** that powers the CLI/TUI experience. This path begins with `POST /session/:id/message` in `packages/opencode/src/server/server.ts:831-904`, flows through the shared session store in `packages/opencode/src/session/index.ts:266-372`, and spends most of its time inside `SessionPrompt.prompt` (`packages/opencode/src/session/prompt.ts:99-422` + helper sections at 476-837).
- The loop covers: enqueuing the user message (`createUserMessage` at `prompt.ts:639-887`), resolving models/tools (`prompt.ts:176-637`), streaming completions/tool calls via `createProcessor` and `streamText`, mutating chat history via `Session.updateMessage/Part`, and broadcasting to subscribers via `Bus` + `MessageV2.Event`.
- Instrumentation + benchmarking must therefore treat **chat message latency**, **tool call throughput**, **queueing behavior** (`state().queued` inside `prompt.ts:71-117`), and **storage pressure** (Storage writes invoked in `session/index.ts:254-373` and `message-v2.ts:328-375`) as first-class metrics.

## Current Context

- No existing `perf/` assets (`rg --files -g '*perf*'` produced zero matches on 2025-11-16).
- GitHub search (`gh issue list --search perf --limit 10` / `gh pr list --search perf --limit 10`) shows no in-flight perf efforts, so this spec defines the initial canonical approach for benchmarking the chat pipeline.

## Targeted Bench & Profiling Artefacts

| Area                | Files / Lines                                                                                                                  | Goal                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Macro (chat loop)   | `server.ts:831-904`, `prompt.ts:99-422`, `prompt.ts:476-704`, `message-v2.ts:12-377`                                           | Measure p50/p95 latency + throughput for end-to-end `POST /session/:id/message` flow, inc. retries + queued messages.   |
| Micro (hot helpers) | `prompt.ts:176-405` (`resolveModel`, `resolveSystemPrompt`, `resolveTools`), `MessageV2.toModelMessage` (`message-v2.ts:384+`) | Use `tinybench` to compare serialization/build variants impacting every turn.                                           |
| Tool orchestration  | `prompt.ts:508-587` + `MCP.tools()` integration at `prompt.ts:589-636`                                                         | Benchmark pool + concurrency behavior when executing builtin + MCP tools, capturing event-loop delay + metadata writes. |
| Storage churn       | `session/index.ts:254-373`, `SessionCompaction` at `session/compaction.ts:25-210`                                              | Stress-test message diff persistence, compaction triggers, and queue flush heuristics.                                  |
| Memory & GC         | Queue state in `prompt.ts:71-117`, `SessionCompaction.run` at `compaction.ts:176-316`                                          | Detect leaks caused by unbounded queued maps, compaction snapshots, or Snapshot diffs.                                  |
| Pool correctness    | Shared helper `prompt.ts:176-405` & upcoming pool wrappers in `perf/pools/`                                                    | Ensure pooled processors/tool contexts reset between turns.                                                             |

## Scenario Definition

1. **Primary benchmark**: Spin up the HTTP server (`packages/opencode/src/server/server.ts`) with an in-memory provider stub that short-circuits the actual model but keeps tool invocation + storage writes intact. Execute autocannon/wrk via `perf/macro/chat-loop.bench.ts` hitting `POST /session/:id/message` with representative payloads, capturing:
   - wall-clock latency start→assistant completion
   - queue wait time when multiple concurrent requests share a session (exercise `state().queued`)
   - throughput of tool calls per second (derived from `ToolPart` updates)
2. **Replay harness**: Provide a script to run the chat loop without HTTP by invoking `SessionPrompt.prompt` directly using fixture messages from the real repo (`packages/opencode/src/tool/task.ts:60-108` is an existing consumer we can mimic). Allows deterministic microbenchmarks + CPU profiles via 0x/clinic.
3. **Regression budgets**: Persist baseline JSON keyed by (scenario, Node version, provider stub). CLI `perf/regression/check-regressions.ts` reads results emitted by macro/micro benches and fails if latency >20% or throughput <80% of baseline.

## Requirements Specific to OpenCode

1. **Realistic message content**: Use fixtures extracted from actual chat transcripts stored in `Storage` (see `Session.messages` in `session/index.ts:271-284`) so we exercise parsing of diffs, tool metadata, and `Snapshot` payloads.
2. **Tool fidelity**: Benchmarks must exercise the Bash/List/Read task flow because these are the dominant tool calls in production sessions (`prompt.ts:508-704`). Provide toggles to enable/disable MCP tool shims to compare latencies.
3. **Queue pressure**: Include a macro test that fires N concurrent messages into the same session ID to validate queue draining + starvation behavior (should surface if `state().queued` grows unbounded).
4. **Storage footprint**: Track bytes written/read during each benchmark by wrapping `Storage.write`/`Storage.update` (from `packages/opencode/src/storage/storage.ts`) so we can flag regressions when message parts get larger.
5. **Profiler hooks**: Provide shell wrappers under `perf/tools/clinic` that start `clinic flame` against the `SessionPrompt.prompt` hot path (tying into instructions from §2). Document how to attach `node --inspect` to the CLI entrypoint.
6. **Pools**: Document + simulate pooling around `ToolRegistry` + `Snapshot` diffs. Provide `withPooled` helper in `perf/pools/pool-utils.ts` wired to actual `ToolRegistry` contexts, verifying they reset metadata after release.

## Definition of Done

- `perf/README.md` explains the above scenario, includes commands for tinybench, autocannon, clinic/0x, heapdump/memwatch, and references exact code paths.
- Macro benchmark script `perf/macro/chat-loop.bench.ts` boots the HTTP server (using the real `packages/opencode` server entry) and runs autocannon scenarios defined under `perf/tools/autocannon/chat-loop.json`, emitting JSON with latency/throughput queue stats.
- Replay helper `perf/macro/chat-loop-replay.ts` directly invokes `SessionPrompt.prompt` with fixture data to allow deterministic CPU/memory profiling.
- Microbenchmarks exist for `resolveTools` + `MessageV2.toModelMessage`, reporting ops/s and ratios vs alt implementations.
- Memory smoke test `perf/memory/chat-loop-leak.spec.ts` runs repeated prompts while tracking heap via `memwatch-next`, failing if heap grows >20% after warmup.
- Pool correctness bench `perf/pools/processor-pool.spec.ts` validates init/reset semantics for any new pooling layer introduced around processors/tool contexts.
- Regression checker reads/writes `perf/regression/baselines.json`, enforces budgets, and supports `--update-baseline`.
- Tool wrappers exist (`perf/tools/autocannon/*.json`, `perf/tools/clinic/run-flame-chat-loop.sh`, etc.) referencing actual commands (`bun run packages/opencode/src/server/server.ts` or equivalent) plus instructions to record Node version + env metadata.

## Phased Implementation Plan

**Phase 1 – Layout + Instrumentation Hooks**

- Scaffold `perf/` tree with README + subfolders mirroring §6 of the user guide.
- Add lightweight instrumentation toggles (e.g., env vars) to `SessionPrompt.prompt` and `Session.updatePart` so benchmarks can capture timings/byte counts without affecting production behavior.

**Phase 2 – Macro Bench Harness**

- Implement server bootstrap + autocannon runner for chat loop scenario; record queue wait, completion latency, tool throughput, memory usage snapshots.
- Provide replay harness to run `SessionPrompt.prompt` headlessly for profiling (clinic/0x wrappers + sample flamegraphs).

**Phase 3 – Micro + Memory Suites**

- Add tinybench suites for serialization + tool resolution hotspots; verify they log Node version + env info.
- Implement memwatch/heapdump-driven leak detection + pooling correctness specs tied to tool contexts; feed results into regression checker.

**Phase 4 – Regression + Documentation**

- Finalize `perf/regression/check-regressions.ts`, baselines JSON format, and CI integration instructions.
- Expand README/tool docs with troubleshooting steps (GC flags, `node --inspect`, `clinic doctor`, etc.) tailored to the chat loop.

## Risks / Open Questions

- Need a deterministic provider stub so benchmarks don’t spend time in real LLM calls; plan to add one under `packages/opencode/src/provider/provider.ts` guarded by a flag.
- Continuous autocannon tests against real tool calls may mutate the workspace; we must sandbox via a temp repo clone or fixture workspace.
- Heap profiling under repeated tool calls may require OS-specific permissions (heapdump writes). Document prerequisites.
