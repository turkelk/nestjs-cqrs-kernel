import { Response } from 'express';
import { MetricsService } from './MetricsService';
export declare class MetricsController {
    private readonly metrics;
    constructor(metrics: MetricsService);
    getMetrics(res: Response): Promise<void>;
}
