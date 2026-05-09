import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../cqrs/constants';

export interface RedisModuleOptions {
  url?: string;
}

@Global()
@Module({})
export class RedisModule {
  private static readonly logger = new Logger('RedisModule');

  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    const redisProvider = {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = options.url || process.env.REDIS_URL || 'redis://localhost:6379';
        const client = new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            const delay = Math.min(times * 200, 5000);
            RedisModule.logger.warn(`Redis reconnecting (attempt ${times}, delay ${delay}ms)`);
            return delay;
          },
        });

        client.on('connect', () => RedisModule.logger.log('Redis connected'));
        client.on('error', (err) => RedisModule.logger.error('Redis error', err.message));

        return client;
      },
    };

    return {
      module: RedisModule,
      providers: [redisProvider],
      exports: [REDIS_CLIENT],
    };
  }
}
