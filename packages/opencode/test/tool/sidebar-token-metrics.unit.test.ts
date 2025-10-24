import { describe, expect, test } from "bun:test";
import { computeTokenMetrics } from "../../src/util/token-metrics";

describe("token metrics unit tests", () => {
  test("computes metrics for sample messages with limit", () => {
    const messages = [
      { role: "user", tokens: { input: 0, output: 0, reasoning: 0 }, cost: 0 },
      { role: "assistant", tokens: { input: 10, output: 5, reasoning: 2 }, cost: 1, providerID: "p1", modelID: "m1" },
      { role: "user", tokens: { input: 0, output: 0, reasoning: 0 } },
      { role: "assistant", tokens: { input: 20, output: 5, reasoning: 5 }, cost: 2, providerID: "p1", modelID: "m1" },
    ];
    const models = { p1: { models: { m1: { limit: { context: 200 } } } } };
    const res = computeTokenMetrics(messages as any, models as any);
    if (!res) throw new Error("no result");
    // 10+5+2 + 20+5+5 = 47
    if (res.tokensTotal !== 47) throw new Error("unexpected tokensTotal" );
    if (res.requestTokensTotal !== 47) throw new Error("unexpected requestTokensTotal");
    if (res.costTotal !== 3) throw new Error("unexpected costTotal");
    if (res.percentage !== 15) throw new Error("unexpected percentage");
  });

  test("handles missing model limit gracefully (no percentage)", () => {
    const messages = [
      { role: "assistant", tokens: { input: 3, output: 1, reasoning: 1 }, cost: 0.5, providerID: "p1", modelID: "m1" }
    ];
    const models = { p1: { models: { m1: { /* no limit */ } } } };
    const res = computeTokenMetrics(messages as any, models as any);
    if (res.tokensTotal !== 5) throw new Error("unexpected tokensTotal");
    if (res.requestTokensTotal !== 5) throw new Error("unexpected requestTokensTotal");
    if (res.costTotal !== 0.5) throw new Error("unexpected costTotal");
    if (res.percentage !== null) throw new Error("expected null percentage");
  });
});
