import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PipelineExecutor } from './cqrs/PipelineExecutor';
import { LogBehavior } from './cqrs/behaviors/LogBehavior';
import { ValidationBehavior } from './cqrs/behaviors/ValidationBehavior';
import { CacheBehavior } from './cqrs/behaviors/CacheBehavior';
import { DistributedLockBehavior } from './cqrs/behaviors/DistributedLockBehavior';
import { TransactionalBehavior } from './cqrs/behaviors/TransactionalBehavior';
import { PerformanceBehavior } from './cqrs/behaviors/PerformanceBehavior';
import { MetricsService } from './metrics/MetricsService';
import { MetricsController } from './metrics/MetricsController';
import { GracefulShutdownService } from './lifecycle/GracefulShutdownService';
import { RedisStreamPublisher } from './events/RedisStreamPublisher';
import { RedisModule, type RedisModuleOptions } from './redis/redis.module';
import { UnleashModule, type UnleashModuleOptions } from './unleash/unleash.module';

export interface SharedKernelModuleOptions {
  redis?: RedisModuleOptions;
  unleash?: UnleashModuleOptions | false;
  imports?: Array<Type | DynamicModule>;
}

/**
 * SharedKernelModule bundles all cross-cutting CQRS pipeline behaviors,
 * Redis, Unleash, and the PipelineExecutor into a single importable module.
 *
 * All 4 microservices should import this module to get the full behavior chains:
 *   Commands: Log → FeatureFlag → Validate → Cache → DistributedLock → Transactional → Handler
 *   Queries:  Log → FeatureFlag → Validate → Cache → Handler
 *
 * Every command is transactional by default (UnitOfWork pattern).
 * Use @IsolatedTransaction() to opt out of ambient transaction joining.
 */
@Global()
@Module({})
export class SharedKernelModule {
  static forRoot(options: SharedKernelModuleOptions = {}): DynamicModule {
    const imports: Array<Type | DynamicModule> = [
      CqrsModule.forRoot(),
      RedisModule.forRoot(options.redis),
      ...(options.imports ?? []),
    ];

    if (options.unleash !== false) {
      imports.push(UnleashModule.forRoot(options.unleash));
    }

    const exports: any[] = [
      CqrsModule,
      RedisModule,
      RedisStreamPublisher,
      LogBehavior,
      ValidationBehavior,
      CacheBehavior,
      DistributedLockBehavior,
      TransactionalBehavior,
      PerformanceBehavior,
      MetricsService,
      GracefulShutdownService,
      PipelineExecutor,
    ];

    if (options.unleash !== false) {
      exports.push(UnleashModule);
    }

    return {
      module: SharedKernelModule,
      imports,
      controllers: [MetricsController],
      providers: [
        LogBehavior,
        ValidationBehavior,
        CacheBehavior,
        DistributedLockBehavior,
        TransactionalBehavior,
        PerformanceBehavior,
        MetricsService,
        GracefulShutdownService,
        RedisStreamPublisher,
        PipelineExecutor,
      ],
      exports,
    };
  }
}
