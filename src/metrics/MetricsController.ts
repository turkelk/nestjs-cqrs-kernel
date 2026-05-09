import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../guards/JwtAuthGuard';
import { MetricsService } from './MetricsService';

@Public()
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metricsOutput = await this.metrics.getMetrics();
    res.set('Content-Type', this.metrics.getContentType());
    res.end(metricsOutput);
  }
}
