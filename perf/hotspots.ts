export type HotspotSample = {
  count: number
  totalMs: number
  maxMs: number
}

const metrics: Record<string, HotspotSample> = {}
let enabled = process.env.OPENCODE_PERF_TRACE === "1"

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}

function get(name: string) {
  const metric = metrics[name]
  if (metric) return metric
  return (metrics[name] = { count: 0, totalMs: 0, maxMs: 0 })
}

export namespace Hotspots {
  export function setEnabled(value: boolean) {
    enabled = value
  }

  export function record(name: string, durationMs: number) {
    if (!enabled) return
    const metric = get(name)
    metric.count += 1
    metric.totalMs += durationMs
    if (durationMs > metric.maxMs) metric.maxMs = durationMs
  }

  export function start(name: string) {
    if (!enabled) return () => {}
    const startTime = now()
    return () => {
      const end = now()
      record(name, end - startTime)
    }
  }

  export async function timed<T>(name: string, fn: () => Promise<T> | T) {
    const stop = start(name)
    try {
      return await fn()
    } finally {
      stop()
    }
  }

  export function snapshot() {
    return {
      enabled,
      metrics: JSON.parse(JSON.stringify(metrics)) as Record<string, HotspotSample>,
    }
  }

  export function reset() {
    for (const key of Object.keys(metrics)) delete metrics[key]
  }
}
