# OpenCode Performance Suite

## Perf Workflow (Standard)

1. Define scenario (micro/macro/memory/pools)
2. Benchmark (tinybench for micro; autocannon for macro)
3. Profile (Clinic.js/DevTools/0x) on the same scenario
4. Fix in small steps with a single, measurable change
5. Guard with regression JSON and CI thresholds

Record Node/Bun version and NODE_ENV for every run.

## Canonical Tools

- tinybench (microbench)
- autocannon (HTTP load)
- Clinic.js (flame/doctor/bubbleprof)
- 0x (lightweight CPU profiling)
- DevTools (CPU/heap), heapdump, memwatch

## Message & Streaming Benches

- `bun perf/macro/http-message-send.bench.ts` boots the Bun server, creates a session, and hammers `POST /session/:id/message` with autocannon. Override `PERF_CONNECTIONS`/`PERF_DURATION` to change load. Results land in `perf/regression/macro-http-message.json`.
- `bun perf/macro/sse-events.bench.ts` opens `/event`, fires `PERF_STREAM_MESSAGES` sequential prompts, and records time-to-first-event + per-message SSE throughput (`perf/regression/macro-sse-events.json`). Adjust `PERF_STREAM_SETTLE_MS` to wait longer for tail events.
- Both benches default to `OPENCODE_PERF_PROVIDER=stub` so `SessionPrompt.prompt` emits deterministic streaming chunks without real LLM keys. Override `perf/tools/autocannon/chat-loop.json` to tweak payloads.

## Conventions

- Run macro under NODE_ENV=production
- Optional Node flags: --expose-gc, --trace-gc, --inspect
- Suggested env: PERF_OUT=perf/regression, PERF_DURATION, PERF_CONNECTIONS, PERF_STREAM_MESSAGES, PERF_STREAM_SETTLE_MS
- Set `OPENCODE_PERF_PROVIDER=stub` (bench scripts do this automatically) for local perf loops; unset to verify real provider behavior sparingly.

## CI Guardrail

- A reduced suite (micro + a couple macro/memory cases) will be enforced by perf/regression/check-regressions.ts with per-metric budgets. Wiring to CI comes later in T-08.

## Directory Layout (scaffold)

```
perf/
  README.md
  micro/
  macro/
  memory/
  pools/
  regression/
  tools/
    autocannon/
    clinic/
```

Each suite will add its own harness and emit JSON under perf/regression for the central checker.

The `perf/` workspace exists to keep the **primary chat loop** fast and predictable.
Everything here targets the production path that starts at `POST /session/:id/message`
(`packages/opencode/src/server/server.ts:831-904`), runs through
`SessionPrompt.prompt` (`packages/opencode/src/session/prompt.ts:99-904`), mutates
session state via `Session.update*` (`packages/opencode/src/session/index.ts:254-373`), and
streams tool calls + patches via `MessageV2` (`packages/opencode/src/session/message-v2.ts`).

## Mental Model

1. **Define a scenario** – which part of the chat loop is under scrutiny (server
   POST endpoint, direct prompt replay, tool execution, etc.).
2. **Benchmark** – measure latency/throughput/allocations using tinybench for
   micro hotspots and autocannon/0x for end-to-end load.
3. **Profile** – attach DevTools/clinic/0x to the same scenario under load to
   capture CPU, event-loop lag, and GC.
4. **Fix in small steps** – modify a single subsystem (prompt building,
   tool orchestration, compaction) and re-run the benchmark.
5. **Regressions** – record JSON baselines and fail CI if sustained metrics are
   outside the allowed budget.

Always record:

- Node/Bun version (`bun --version`, `node --version`) and `NODE_ENV`.
- Whether the provider is real or stubbed.
- Concurrency, duration, payload shape, and sample count.

## Directory Layout

```
perf/
  README.md
  micro/
    resolve-tools.bench.ts
    message-serialization.bench.ts
  macro/
    chat-loop.bench.ts
    chat-loop-replay.ts
  memory/
    chat-loop-leak.spec.ts
  pools/
    processor-pool.spec.ts
    pool-utils.ts
  regression/
    baselines.json
    check-regressions.ts
  tools/
    autocannon/
      chat-loop.json
    clinic/
      run-flame-chat-loop.sh
      run-doctor-chat-loop.sh
```

Each subdirectory mirrors the workflow described above. Add new files next to
these seeds when extending coverage.

## Scenarios

### 1. Macro (HTTP) – `/session/:id/message`

- Use `perf/macro/chat-loop.bench.ts` to boot the Hono server with the existing
  routing stack. The script accepts `--duration`, `--connections`, and
  `--session-id` flags, injects an in-memory provider stub, then spawns
  `autocannon` with the request template stored in
  `perf/tools/autocannon/chat-loop.json`.
- Metrics recorded per run:
  - p50/p95/p99 latency (wall clock send→assistant done)
  - queue wait (time spent inside `state().queued` before acquiring the lock)
  - completed tool calls / second (derived from `ToolPart` updates)
  - bytes written to `Storage.write`/`Storage.update` (via instrumentation toggles)
- Results are JSON lines stored under `.perf-results/macro/`. Feed them into the
  regression checker.

### 2. Macro (Replay) – `SessionPrompt.prompt`

- `perf/macro/chat-loop-replay.ts` bypasses HTTP and calls
  `SessionPrompt.prompt` directly using fixture data derived from real sessions.
- Perfect for deterministic CPU/heap profiling with `clinic flame`, `clinic
doctor`, or `node --inspect`. Wrap via the scripts inside `perf/tools/clinic`.

### 3. Micro (Functions)

- `perf/micro/resolve-tools.bench.ts`: isolates the tool-resolution pipeline in
  `prompt.ts:508-636` using `tinybench`. Compares the current merge/deep clone
  approach against a cached variant.
- `perf/micro/message-serialization.bench.ts`: exercises
  `MessageV2.toModelMessage` serialization for long chat histories to track
  allocations and throughput.

### 4. Memory / Leak Detection

- `perf/memory/chat-loop-leak.spec.ts` runs repeated `SessionPrompt.prompt`
  invocations via the replay harness, sampling `process.memoryUsage()` and
  `memwatch-next` leak events. Writes heap snapshots via `heapdump` when growth
  exceeds the configured threshold.
- Use together with `node --trace_gc` or `clinic doctor -- node bun ...` to
  inspect GC pressure.

### 5. Pools / Object Reuse

- `perf/pools/pool-utils.ts` exports a generic `Pool<T>` + `withPooled` helper
  tuned for resetting tool contexts.
- `perf/pools/processor-pool.spec.ts` stress-tests pooled processors that wrap
  `SessionPrompt.createProcessor`. Ensures state is cleared (tool metadata,
  abort controllers, timers) and that pool size respects bounds.

### 6. Regression Enforcement

- `perf/regression/check-regressions.ts` reads recent benchmark outputs and
  compares them to `perf/regression/baselines.json` using per-scenario budgets
  (default ±20% latency, ±20% throughput). Use `--update-baseline` to refresh the
  stored numbers once a change is validated.
- Intended to run in CI (see docs inside the file).

## Tooling & Prerequisites

| Tool                               | Purpose                 | Install                                          |
| ---------------------------------- | ----------------------- | ------------------------------------------------ |
| `tinybench`                        | Microbench harness      | `bun add -d tinybench` (already listed)          |
| `autocannon`                       | HTTP load               | `bun add -d autocannon` or `npm i -g autocannon` |
| `clinic` (doctor/flame/bubbleprof) | CPU + async profiling   | `npm i -g clinic`                                |
| `memwatch-next`, `heapdump`        | Memory leak detection   | Local dev dependency                             |
| `0x`                               | Alternative flamegraphs | Optional                                         |

All scripts default to `bun` but support `node`.

## Workflow Checklist

1. Choose a scenario (HTTP macro, replay macro, micro helper).
2. Ensure fixtures exist (see `perf/macro/fixtures/` when added) and update
   payloads to mirror the current chat log schema.
3. Record environment metadata (Node/Bun versions, CPU, branch) at the start of
   each run. The scripts already log this to stdout/JSON.
4. Run the benchmark:
   - Micro: `bun perf/micro/resolve-tools.bench.ts`
   - Macro HTTP: `bun perf/macro/chat-loop.bench.ts --duration 15 --connections 64`
   - Macro replay: `bun perf/macro/chat-loop-replay.ts --iterations 25`
5. Profile the same scenario via `perf/tools/clinic/*.sh` or `node --inspect` if
   the run shows regressions.
6. Update baselines via `bun perf/regression/check-regressions.ts --update-baseline`
   once the team agrees on the new performance level.

## Notes

- Scenarios that interact with the filesystem should run against a temp copy of
  the workspace to avoid overwriting local changes.
- `SessionPrompt.prompt` currently enforces a single-flight lock per session. The
  macro bench intentionally hammers the same session ID to surface queue latency
  and ensure `state().queued` is bounded.
- The provider stub toggled via `OPENCODE_PERF_PROVIDER=stub` keeps all tool
  calls intact but avoids real LLM spend. See `perf/macro/chat-loop-replay.ts`
  for the implementation hook.
