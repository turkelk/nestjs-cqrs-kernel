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

export type SharedKernelModuleOptions = QuanticModuleOptions;

export interface QuanticModuleOptions {
  redis?: RedisModuleOptions;
  unleash?: UnleashModuleOptions | false;
  imports?: Array<Type | DynamicModule>;
}

@Global()
@Module({})
export class QuanticModule {
  static forRoot(options: QuanticModuleOptions = {}): DynamicModule {
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
      module: QuanticModule,
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

/** @deprecated Use QuanticModule instead */
export const SharedKernelModule = QuanticModule;
