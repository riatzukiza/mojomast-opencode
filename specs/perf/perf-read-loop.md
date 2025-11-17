# Perf Scenario – Message Preprocessing & Read Tool IO

## Context

- Slow "waiting to resume" windows on large repositories have been traced to synchronous work inside `SessionPrompt.createUserMessage` (`packages/opencode/src/session/prompt.ts:798-1056`). That helper expands `@file` / `@dir` references, performs LSP lookups for symbol-only ranges, and calls `ReadTool` / `ListTool` before the session loop can continue.
- When a referenced file is missing, the fallback path in `ReadTool` (`packages/opencode/src/tool/read.ts:65-85`) runs `fs.readdirSync` to gather suggestions. Large directories turn that into a measurable pause prior to any model streaming.
- The existing perf plans (`specs/perf/perf-suite.md`, `specs/perf/perf-message-stream.md`) require each hotspot to gain a benchmark harness plus regression outputs. No suite currently covers message preprocessing or the synchronous filesystem access described above.

## Code References

1. `packages/opencode/src/session/prompt.ts:798-1056` – `createUserMessage` resolves prompt parts, triggers Read/List tool execution, and performs synchronous file IO via Bun + LSP before entering the main session loop.
2. `packages/opencode/src/tool/read.ts:65-159` – File existence checks, `fs.readdirSync` suggestion path, binary/preview filtering, and `Bun.file(...).text()`/`.bytes()` calls for attachments.
3. `packages/opencode/src/tool/ls.ts` (indirect via `createUserMessage`) – Directory listings for `@dir` prompts contribute to preprocessing latency on large repos.
4. `perf/README.md`, `perf/micro/*.bench.ts` – Framework requirements for tinybench-based micro benchmarks and regression JSON output per scenario.

## Existing Issues / PRs

- No GitHub issues or PRs currently track Read tool preprocessing performance (checked with `gh issue list -S "read tool"` and `gh pr list -S "read tool"`).

## Requirements

1. Build a tinybench-based micro benchmark under `perf/micro/` that simulates message preprocessing against a large filesystem tree. It must:
   - Generate a temp directory populated with thousands of files/dirs to mimic big repos.
   - Exercise both the missing-file suggestion branch (calling `fs.readdirSync` + filtering) and the large-file attachment path (reading + encoding files as `createUserMessage` does).
   - Surface configurable parameters via env vars (e.g., `PERF_FS_ENTRIES`, `PERF_FS_FILESIZE`) so engineers can scale stress locally.
2. Record benchmark metrics via `perf/macro/utils.writePerfResult`, writing JSON to `perf/regression/micro-message-preprocess.json` (or similar) with suite/name metadata, environment info (Node/Bun versions), and ops/sec per scenario.
3. Print a console table describing ops/sec & avg runtime so the CLI provides immediate feedback.
4. Document how to run the new bench (command + env knobs) inside `perf/README.md` alongside the other suites.
5. Ensure the script cleans up fixture directories after completion to avoid polluting the repo.

## Definition of Done

- `bun perf/micro/message-preprocess.bench.ts` (or equivalent) generates the fixture tree, runs tinybench cases for missing-file suggestions + large file reads, and writes a JSON result file under `perf/regression/`.
- `perf/README.md` mentions the new bench, scope, command, and tunable env vars.
- Benchmark logs include Node/Bun metadata and the number of filesystem entries exercised so regressions can be compared over time.
- Temp directories/files created for the bench are deleted after each run, keeping the repo clean.

## Notes / Follow-ups

- Future work can hook directly into `ReadTool.execute` once we untangle tool context dependencies; this initial bench focuses on filesystem IO primitives to unblock profiling.
- Consider adding instrumentation in `ReadTool` to sample directory sizes and emit telemetry so we can correlate benchmark results with production traces.
