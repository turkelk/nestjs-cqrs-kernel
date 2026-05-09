import { OnModuleInit } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
export declare class MetricsService implements OnModuleInit {
    readonly registry: Registry<"text/plain; version=0.0.4; charset=utf-8">;
    readonly buildTotal: Counter<"status" | "tech_stack">;
    readonly stageDuration: Histogram<"status" | "stage_type">;
    readonly promptCacheHits: Counter<string>;
    readonly queueDepth: Gauge<"queue">;
    readonly handlerDuration: Histogram<"handler" | "result">;
    onModuleInit(): void;
    getMetrics(): Promise<string>;
    getContentType(): string;
}
//# sourceMappingURL=MetricsService.d.ts.map