import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { getCacheMetadata } from '../decorators/Cache.decorator';
import { Result } from '../../result/Result';
import { REDIS_CLIENT } from '../constants';
import type { Redis } from 'ioredis';

@Injectable()
export class CacheBehavior {
  private readonly logger = new Logger(CacheBehavior.name);

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    const metadata = getCacheMetadata(command.constructor);

    if (!metadata || !this.redis) {
      return next();
    }

    const cacheKey = this.interpolateKey(metadata.key, command);

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return Result.success(JSON.parse(cached) as T);
      }
    } catch {
      this.logger.warn(`Cache read failed for key: ${cacheKey}`);
    }

    const result = await next();

    if (result.isSuccess && result.value !== undefined) {
      try {
        await this.redis.set(cacheKey, JSON.stringify(result.value), 'EX', metadata.ttlSeconds!);
        this.logger.debug(`Cache set: ${cacheKey} (TTL: ${metadata.ttlSeconds}s)`);
      } catch {
        this.logger.warn(`Cache write failed for key: ${cacheKey}`);
      }
    }

    return result;
  }

  private interpolateKey(template: string, command: object): string {
    return template.replace(/\{(\w+)\}/g, (_, prop) => {
      const value = (command as Record<string, unknown>)[prop];
      return value != null ? String(value) : '';
    });
  }
}
