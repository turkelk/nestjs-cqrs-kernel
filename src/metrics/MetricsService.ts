import { Injectable, OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly buildTotal = new Counter({
    name: 'arex_build_total',
    help: 'Total number of builds',
    labelNames: ['status', 'tech_stack'] as const,
    registers: [this.registry],
  });

  readonly stageDuration = new Histogram({
    name: 'arex_stage_duration_seconds',
    help: 'Duration of pipeline stages in seconds',
    labelNames: ['stage_type', 'status'] as const,
    buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300],
    registers: [this.registry],
  });

  readonly promptCacheHits = new Counter({
    name: 'arex_prompt_cache_hits_total',
    help: 'Total prompt cache hits',
    registers: [this.registry],
  });

  readonly queueDepth = new Gauge({
    name: 'arex_queue_depth',
    help: 'Current depth of Bull job queue',
    labelNames: ['queue'] as const,
    registers: [this.registry],
  });

  readonly handlerDuration = new Histogram({
    name: 'arex_handler_duration_seconds',
    help: 'Duration of command/query handlers in seconds',
    labelNames: ['handler', 'result'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
