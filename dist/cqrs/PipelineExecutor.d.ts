import { OnModuleInit } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Result } from '../result/Result';
import { LogBehavior } from './behaviors/LogBehavior';
import { FeatureFlagBehavior } from './behaviors/FeatureFlagBehavior';
import { ValidationBehavior } from './behaviors/ValidationBehavior';
import { CacheBehavior } from './behaviors/CacheBehavior';
import { DistributedLockBehavior } from './behaviors/DistributedLockBehavior';
import { TransactionalBehavior } from './behaviors/TransactionalBehavior';
import { PerformanceBehavior } from './behaviors/PerformanceBehavior';
/**
 * PipelineExecutor wraps CommandBus and QueryBus with separate behavior chains.
 *
 * Command chain (all writes):
 *   Performance → Log → FeatureFlag → Validate → Cache → DistributedLock → Transactional → Handler
 *
 * Query chain (reads only):
 *   Performance → Log → FeatureFlag → Validate → Cache → Handler
 *
 * Every command is transactional by default (UnitOfWork pattern).
 * Queries skip Transactional and DistributedLock — they are read-only.
 */
export declare class PipelineExecutor implements OnModuleInit {
    private readonly commandBus;
    private readonly queryBus;
    private readonly logBehavior;
    private readonly featureFlagBehavior;
    private readonly validationBehavior;
    private readonly cacheBehavior;
    private readonly distributedLockBehavior;
    private readonly transactionalBehavior;
    private readonly performanceBehavior;
    private readonly logger;
    private commandBehaviors;
    private queryBehaviors;
    constructor(commandBus: CommandBus, queryBus: QueryBus, logBehavior: LogBehavior, featureFlagBehavior: FeatureFlagBehavior | undefined, validationBehavior: ValidationBehavior, cacheBehavior: CacheBehavior, distributedLockBehavior: DistributedLockBehavior, transactionalBehavior: TransactionalBehavior, performanceBehavior: PerformanceBehavior);
    onModuleInit(): void;
    executeCommand<T>(command: object): Promise<Result<T>>;
    executeQuery<T>(query: object): Promise<Result<T>>;
    private runPipeline;
}
//# sourceMappingURL=PipelineExecutor.d.ts.map