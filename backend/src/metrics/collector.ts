// backend/src/metrics/collector.ts
// Prometheus metrics collection for the Solana Smart Stack backend.

import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Define metrics
export const requestCounter = new client.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'endpoint', 'status'] as const,
});

export const requestDuration = new client.Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'endpoint', 'status'] as const,
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const errorCounter = new client.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors by code',
  labelNames: ['code'] as const
});

export const retryCounter = new client.Counter({
  name: 'api_retries_total',
  help: 'Total number of retries performed by failure type',
  labelNames: ['failure_type'] as const
});

// Register the metrics
register.registerMetric(requestCounter);
register.registerMetric(requestDuration);
register.registerMetric(errorCounter);
register.registerMetric(retryCounter);

// Expose the metrics endpoint content
export async function getMetrics() {
  return await register.metrics();
}

export default register;
