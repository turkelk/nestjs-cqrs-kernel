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
import { WorkflowBehavior } from './behaviors/WorkflowBehavior';
/**
 * PipelineExecutor wraps CommandBus and QueryBus with separate behavior chains.
 *
 * Command chain (all writes):
 *   Log → Performance → FeatureFlag → Validate → Workflow → Cache → DistributedLock → Transactional → Handler
 *
 * Query chain (reads only):
 *   Log → Performance → FeatureFlag → Validate → Cache → Handler
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
    private readonly workflowBehavior;
    private readonly logger;
    private commandBehaviors;
    private queryBehaviors;
    constructor(commandBus: CommandBus, queryBus: QueryBus, logBehavior: LogBehavior, featureFlagBehavior: FeatureFlagBehavior | undefined, validationBehavior: ValidationBehavior, cacheBehavior: CacheBehavior, distributedLockBehavior: DistributedLockBehavior, transactionalBehavior: TransactionalBehavior, performanceBehavior: PerformanceBehavior, workflowBehavior: WorkflowBehavior | undefined);
    onModuleInit(): void;
    executeCommand<T>(command: object, context?: Map<string, unknown>): Promise<Result<T>>;
    executeQuery<T>(query: object): Promise<Result<T>>;
    private runPipeline;
}
