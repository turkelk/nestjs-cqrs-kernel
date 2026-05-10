import { DynamicModule } from '@nestjs/common';
import { type RedisModuleOptions } from './redis/redis.module';
import { type UnleashModuleOptions } from './unleash/unleash.module';
export interface SharedKernelModuleOptions {
    redis?: RedisModuleOptions;
    unleash?: UnleashModuleOptions | false;
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
export declare class SharedKernelModule {
    static forRoot(options?: SharedKernelModuleOptions): DynamicModule;
}
//# sourceMappingURL=shared-kernel.module.d.ts.map