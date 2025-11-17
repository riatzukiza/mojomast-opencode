# Perf Plan – Message Send & Streaming

## Scope

- Cover HTTP message sending (`POST /session/:id/message` in packages/opencode/src/server/server.ts:831-869) and SSE streaming (`GET /event` in server.ts:1714-1754).
- Exercise assistant streaming path inside packages/opencode/src/session/prompt.ts:221-422 & 1002-1324 plus Session.update\*(packages/opencode/src/session/index.ts:328-371).
- Ensure Bus → SSE propagation for MessageV2.Event.\* is measurable.

## Existing Work / Issues

- No existing GitHub issues/PRs for perf harness; perf/macro scripts currently placeholders.
- Specs/perf-suite.md already covers macro chat loop generally; this doc narrows to message send + streaming (T-13..T-18).

## Requirements

1. **Perf Stub Provider**
   - Add `OPENCODE_PERF_PROVIDER=stub` mode inside SessionPrompt so `streamText` is replaced with deterministic streaming data.
   - Emit configurable chunk count/delay for reproducible SSE volumes; include Node/Bun metadata in events.
2. **HTTP Message Bench (`perf/macro/http-message-send.bench.ts`)**
   - Boot opencode server (Bun.serve) on ephemeral port.
   - Create session via POST /session.
   - Run autocannon using template config `perf/tools/autocannon/chat-loop.json` (duration, connections env-overridable) to hammer `/session/:id/message` with stub provider.
   - Capture metrics: rps, p50/p95/p99, timeouts/errors, queue wait proxy (#429?). Save JSON to `perf/regression/macro-http-message.json` with schema {suite,name,metrics,meta}.
3. **SSE Bench (`perf/macro/sse-events.bench.ts`)**
   - Reuse stub + session.
   - Open `/event` SSE, send N messages sequentially, buffer SSE payloads.
   - Compute: total events, part update latency (publish→receive), time-to-first-event, per message streaming duration, ordering/loss counts. Emit JSON to `perf/regression/macro-sse-events.json`.
4. **Docs & Scripts**
   - Perf README sections describing stub env + new benches, env vars (PERF_DURATION, PERF_CONNECTIONS, PERF_STREAM_MESSAGES, etc.).
   - Root package.json scripts: `perf:macro:message`, `perf:macro:sse` calling Bun.
   - Mention baselines hooking to `perf/regression`.

## Definition of Done

- `OPENCODE_PERF_PROVIDER=stub` yields consistent assistant streaming (text deltas + finish) without real model keys.
- `bun perf/macro/http-message-send.bench.ts` boots server, runs autocannon, saves JSON file, prints table.
- `bun perf/macro/sse-events.bench.ts` measures SSE metrics (latency, events, drops, durations) and stores JSON.
- Perf README explains workflow + env toggles; docs/agile tasks T-13..T-18 satisfied.
