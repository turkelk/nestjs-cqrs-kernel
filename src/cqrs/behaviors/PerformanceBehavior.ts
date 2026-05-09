import { Injectable, Logger, Optional } from '@nestjs/common';
import { Result } from '../../result/Result';
import { MetricsService } from '../../metrics/MetricsService';

const SLOW_THRESHOLD_MS = 500;

/**
 * PerformanceBehavior logs a warning when a handler exceeds 500ms
 * and records handler duration in Prometheus histogram.
 */
@Injectable()
export class PerformanceBehavior {
  private readonly logger = new Logger('PerformanceBehavior');

  constructor(@Optional() private readonly metrics?: MetricsService) {}

  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    const handlerName = command.constructor.name;
    const startTime = Date.now();

    const result = await next();

    const durationMs = Date.now() - startTime;
    const durationSec = durationMs / 1000;
    const resultLabel = result.isSuccess ? 'success' : 'failure';

    // Record metrics
    this.metrics?.handlerDuration
      .labels(handlerName, resultLabel)
      .observe(durationSec);

    // Warn on slow handlers
    if (durationMs > SLOW_THRESHOLD_MS) {
      this.logger.warn({
        msg: `Slow handler detected: ${handlerName} took ${durationMs}ms`,
        handler: handlerName,
        durationMs,
      });
    }

    return result;
  }
}
