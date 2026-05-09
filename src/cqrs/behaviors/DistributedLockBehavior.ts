import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { getDistributedLockMetadata } from '../decorators/DistributedLock.decorator';
import { Result, ErrorType } from '../../result/Result';
import { REDIS_CLIENT } from '../constants';
import type { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DistributedLockBehavior {
  private readonly logger = new Logger(DistributedLockBehavior.name);

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    const metadata = getDistributedLockMetadata(command.constructor);

    if (!metadata || !this.redis) {
      return next();
    }

    const lockKey = `lock:${this.interpolateKey(metadata.key, command)}`;
    const lockValue = uuidv4();
    const acquired = await this.tryAcquire(
      lockKey,
      lockValue,
      metadata.lockTtlSeconds!,
      metadata.acquireTimeoutSeconds!,
    );

    if (!acquired) {
      this.logger.warn(`Failed to acquire lock: ${lockKey}`);
      return Result.failure<T>(ErrorType.Conflict, `Resource is locked: ${metadata.key}`);
    }

    try {
      return await next();
    } finally {
      await this.release(lockKey, lockValue);
    }
  }

  private async tryAcquire(
    key: string,
    value: string,
    ttlSeconds: number,
    timeoutSeconds: number,
  ): Promise<boolean> {
    const deadline = Date.now() + timeoutSeconds * 1000;
    const retryDelay = 50;

    while (Date.now() < deadline) {
      const result = await this.redis!.set(key, value, 'EX', ttlSeconds, 'NX');
      if (result === 'OK') return true;
      await this.sleep(retryDelay);
    }

    return false;
  }

  private async release(key: string, value: string): Promise<void> {
    // Lua script ensures only the owner releases the lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      await this.redis!.eval(script, 1, key, value);
    } catch {
      this.logger.warn(`Failed to release lock: ${key}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private interpolateKey(template: string, command: object): string {
    return template.replace(/\{(\w+)\}/g, (_, prop) => {
      const value = (command as Record<string, unknown>)[prop];
      return value != null ? String(value) : '';
    });
  }
}
