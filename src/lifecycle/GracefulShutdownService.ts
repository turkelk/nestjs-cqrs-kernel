import { Injectable, Logger, OnModuleDestroy, Optional, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { REDIS_CLIENT } from '../cqrs/constants';
import type { Redis } from 'ioredis';

const SHUTDOWN_TIMEOUT_MS = 30_000;

/**
 * GracefulShutdownService ensures clean resource teardown on SIGTERM/SIGINT.
 *
 * Shutdown order:
 * 1. Wait for in-flight work (subclasses can override `drainWork`)
 * 2. Close database connections
 * 3. Quit Redis
 */
@Injectable()
export class GracefulShutdownService implements OnModuleDestroy {
  private readonly logger = new Logger(GracefulShutdownService.name);

  constructor(
    @Optional() private readonly dataSource?: DataSource,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Graceful shutdown initiated...');

    // 1. Drain in-flight work with timeout
    try {
      await this.withTimeout(this.drainWork(), SHUTDOWN_TIMEOUT_MS, 'Work drain');
    } catch (err) {
      this.logger.warn(`Work drain timeout or error: ${(err as Error).message}`);
    }

    // 2. Close database connections
    if (this.dataSource?.isInitialized) {
      try {
        await this.dataSource.destroy();
        this.logger.log('Database connections closed');
      } catch (err) {
        this.logger.warn(`Database close error: ${(err as Error).message}`);
      }
    }

    // 3. Quit Redis
    if (this.redis) {
      try {
        await this.redis.quit();
        this.logger.log('Redis connection closed');
      } catch (err) {
        this.logger.warn(`Redis quit error: ${(err as Error).message}`);
      }
    }

    this.logger.log('Graceful shutdown complete');
  }

  /**
   * Override in service-specific subclasses to drain Bull queues,
   * close Socket.IO servers, etc.
   */
  protected async drainWork(): Promise<void> {
    // Base implementation — no-op
  }

  private withTimeout(promise: Promise<void>, ms: number, label: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms}ms`));
      }, ms);

      promise
        .then(() => { clearTimeout(timer); resolve(); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }
}
