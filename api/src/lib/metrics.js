/**
 * Lightweight in-process metrics for AUREA API.
 * Exposes Prometheus text + JSON. Multi-instance: scrape each node or swap for
 * a push gateway / OpenTelemetry exporter later — same conceptual series.
 */

const startedAt = Date.now();

/** @type {Map<string, number>} */
const counters = new Map();

/** latency buckets in ms */
const LATENCY_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/** @type {Map<string, { count: number, sum: number, buckets: number[] }>} */
const histograms = new Map();

function key(name, labels = {}) {
  const parts = Object.keys(labels)
    .sort()
    .map((k) => `${k}="${String(labels[k]).replace(/"/g, '\\"')}"`);
  return parts.length ? `${name}{${parts.join(',')}}` : name;
}

export function incCounter(name, labels = {}, by = 1) {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) || 0) + by);
}

export function observeLatency(name, labels, ms) {
  const k = key(name, labels);
  let h = histograms.get(k);
  if (!h) {
    h = { count: 0, sum: 0, buckets: LATENCY_BUCKETS.map(() => 0) };
    histograms.set(k, h);
  }
  h.count += 1;
  h.sum += ms;
  for (let i = 0; i < LATENCY_BUCKETS.length; i += 1) {
    if (ms <= LATENCY_BUCKETS[i]) h.buckets[i] += 1;
  }
}

export function recordHttpRequest({ method, route, status, durationMs }) {
  const labels = {
    method: method || 'UNKNOWN',
    route: route || 'unknown',
    status: String(status || 0),
  };
  incCounter('http_requests_total', labels);
  observeLatency('http_request_duration_ms', {
    method: labels.method,
    route: labels.route,
  }, durationMs);

  if (status >= 500) {
    incCounter('http_errors_total', { method: labels.method, route: labels.route, status: labels.status });
  }
  if (status === 429) {
    incCounter('http_rate_limited_total', { route: labels.route });
  }
}

export function recordBusinessEvent(name, labels = {}) {
  incCounter(`business_${name}_total`, labels);
}

export function getSnapshot() {
  const mem = process.memoryUsage();
  return {
    uptime_sec: Math.floor((Date.now() - startedAt) / 1000),
    process: {
      pid: process.pid,
      node: process.version,
      rss_bytes: mem.rss,
      heap_used_bytes: mem.heapUsed,
      heap_total_bytes: mem.heapTotal,
      external_bytes: mem.external,
    },
    counters: Object.fromEntries(counters),
    histograms: Object.fromEntries(
      [...histograms.entries()].map(([k, v]) => [
        k,
        {
          count: v.count,
          sum: v.sum,
          avg: v.count ? v.sum / v.count : 0,
          buckets: LATENCY_BUCKETS.reduce((acc, b, i) => {
            acc[String(b)] = v.buckets[i];
            return acc;
          }, {}),
        },
      ])
    ),
  };
}

/**
 * Prometheus exposition format (text/plain).
 */
export function toPrometheus() {
  const lines = [];
  lines.push('# HELP process_uptime_seconds Process uptime');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`);

  const mem = process.memoryUsage();
  lines.push('# HELP process_resident_memory_bytes Resident set size');
  lines.push('# TYPE process_resident_memory_bytes gauge');
  lines.push(`process_resident_memory_bytes ${mem.rss}`);
  lines.push('# HELP process_heap_used_bytes Heap used');
  lines.push('# TYPE process_heap_used_bytes gauge');
  lines.push(`process_heap_used_bytes ${mem.heapUsed}`);

  lines.push('# HELP http_requests_total Total HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  for (const [k, v] of counters) {
    if (k.startsWith('http_requests_total')) {
      lines.push(`${k} ${v}`);
    } else if (k.includes('{')) {
      lines.push(`${k} ${v}`);
    } else {
      lines.push(`${k} ${v}`);
    }
  }

  for (const [k, h] of histograms) {
    const base = k.includes('{') ? k.slice(0, k.indexOf('{')) : k;
    const labels = k.includes('{') ? k.slice(k.indexOf('{')) : '';
    lines.push(`# TYPE ${base} histogram`);
    let cumulative = 0;
    for (let i = 0; i < LATENCY_BUCKETS.length; i += 1) {
      cumulative += h.buckets[i];
      const le = LATENCY_BUCKETS[i];
      if (labels) {
        // inject le into labels
        const inner = labels.slice(1, -1);
        lines.push(`${base}_bucket{${inner},le="${le}"} ${cumulative}`);
      } else {
        lines.push(`${base}_bucket{le="${le}"} ${cumulative}`);
      }
    }
    if (labels) {
      const inner = labels.slice(1, -1);
      lines.push(`${base}_bucket{${inner},le="+Inf"} ${h.count}`);
      lines.push(`${base}_sum${labels} ${h.sum}`);
      lines.push(`${base}_count${labels} ${h.count}`);
    } else {
      lines.push(`${base}_bucket{le="+Inf"} ${h.count}`);
      lines.push(`${base}_sum ${h.sum}`);
      lines.push(`${base}_count ${h.count}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

/** Reset for unit tests */
export function resetMetrics() {
  counters.clear();
  histograms.clear();
}

export default {
  incCounter,
  observeLatency,
  recordHttpRequest,
  recordBusinessEvent,
  getSnapshot,
  toPrometheus,
  resetMetrics,
  LATENCY_BUCKETS,
};
