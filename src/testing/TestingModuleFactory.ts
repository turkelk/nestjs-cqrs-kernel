import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { PipelineExecutor } from '../cqrs/PipelineExecutor';
import { LogBehavior } from '../cqrs/behaviors/LogBehavior';
import { ValidationBehavior } from '../cqrs/behaviors/ValidationBehavior';
import { CacheBehavior } from '../cqrs/behaviors/CacheBehavior';
import { DistributedLockBehavior } from '../cqrs/behaviors/DistributedLockBehavior';
import { TransactionalBehavior } from '../cqrs/behaviors/TransactionalBehavior';
import { PerformanceBehavior } from '../cqrs/behaviors/PerformanceBehavior';
import { MetricsService } from '../metrics/MetricsService';
import { REDIS_CLIENT } from '../cqrs/constants';
import { createMockRepository, createMockRedisClient } from './mocks';

export { createMockRepository, createMockRedisClient };

export interface TestingModuleOptions {
  /** Providers to register (handlers, services, etc.) */
  providers?: any[];
  /** Entity classes to auto-mock their repositories */
  entities?: any[];
  /** Additional overrides to apply to the TestingModule builder */
  overrides?: Array<{ provide: any; useValue: any }>;
  /** Whether to include the full CQRS pipeline behaviors (default: false) */
  withPipeline?: boolean;
}

/**
 * Factory for bootstrapping a NestJS TestingModule preconfigured
 * with mocked repositories, Redis, and optionally the CQRS pipeline.
 */
export class TestingModuleFactory {
  static create(options: TestingModuleOptions = {}): TestingModuleBuilder {
    const { providers = [], entities = [], overrides = [], withPipeline = false } = options;

    const mockRepos = entities.map((entity) => ({
      provide: getRepositoryToken(entity),
      useValue: createMockRepository(),
    }));

    const mockRedis = { provide: REDIS_CLIENT, useValue: createMockRedisClient() };

    const pipelineProviders = withPipeline
      ? [
          LogBehavior,
          ValidationBehavior,
          CacheBehavior,
          DistributedLockBehavior,
          TransactionalBehavior,
          PerformanceBehavior,
          MetricsService,
          PipelineExecutor,
        ]
      : [];

    let builder = Test.createTestingModule({
      imports: [CqrsModule.forRoot()],
      providers: [
        ...mockRepos,
        mockRedis,
        ...pipelineProviders,
        ...providers,
      ],
    });

    for (const override of overrides) {
      builder = builder.overrideProvider(override.provide).useValue(override.useValue);
    }

    // Silence NestJS logs during tests
    Logger.overrideLogger(['error']);

    return builder;
  }
}
