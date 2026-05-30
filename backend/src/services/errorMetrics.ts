export class ErrorMetrics {
  private metrics: Record<string, { count: number; recovered: number; avgRetries: number }> = {
    EXPIRED_BLOCKHASH: { count: 0, recovered: 0, avgRetries: 0 },
    FEE_TOO_LOW: { count: 0, recovered: 0, avgRetries: 0 },
    COMPUTE_EXCEEDED: { count: 0, recovered: 0, avgRetries: 0 },
    JITO_LEADER_ERROR: { count: 0, recovered: 0, avgRetries: 0 },
    UNKNOWN: { count: 0, recovered: 0, avgRetries: 0 }
  };

  recordError(type: string, recovered: boolean, retries: number) {
    const metric = this.metrics[type] ?? this.metrics['UNKNOWN'];
    metric.count++;
    if (recovered) metric.recovered++;
    metric.avgRetries = ((metric.avgRetries * (metric.count - 1)) + retries) / metric.count;
  }

  getMetrics() {
    return this.metrics;
  }

  getSuccessRate(type: string): number {
    const metric = this.metrics[type] ?? this.metrics['UNKNOWN'];
    if (metric.count === 0) return 0;
    return (metric.recovered / metric.count) * 100;
  }
}
