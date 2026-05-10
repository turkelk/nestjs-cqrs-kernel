import { Result } from '../../result/Result';
import { MetricsService } from '../../metrics/MetricsService';
/**
 * PerformanceBehavior logs a warning when a handler exceeds 500ms
 * and records handler duration in Prometheus histogram.
 */
export declare class PerformanceBehavior {
    private readonly metrics?;
    private readonly logger;
    constructor(metrics?: MetricsService | undefined);
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
}
