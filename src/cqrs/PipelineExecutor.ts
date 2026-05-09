import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Result } from '../result/Result';
import { LogBehavior } from './behaviors/LogBehavior';
import { FeatureFlagBehavior } from './behaviors/FeatureFlagBehavior';
import { ValidationBehavior } from './behaviors/ValidationBehavior';
import { CacheBehavior } from './behaviors/CacheBehavior';
import { DistributedLockBehavior } from './behaviors/DistributedLockBehavior';
import { TransactionalBehavior } from './behaviors/TransactionalBehavior';
import { PerformanceBehavior } from './behaviors/PerformanceBehavior';

type BehaviorFn = <T>(command: object, next: () => Promise<Result<T>>) => Promise<Result<T>>;

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
@Injectable()
export class PipelineExecutor implements OnModuleInit {
  private readonly logger = new Logger(PipelineExecutor.name);
  private commandBehaviors: BehaviorFn[] = [];
  private queryBehaviors: BehaviorFn[] = [];

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logBehavior: LogBehavior,
    private readonly featureFlagBehavior: FeatureFlagBehavior,
    private readonly validationBehavior: ValidationBehavior,
    private readonly cacheBehavior: CacheBehavior,
    private readonly distributedLockBehavior: DistributedLockBehavior,
    private readonly transactionalBehavior: TransactionalBehavior,
    private readonly performanceBehavior: PerformanceBehavior,
  ) {}

  onModuleInit() {
    this.commandBehaviors = [
      (cmd, next) => this.performanceBehavior.execute(cmd, next),
      (cmd, next) => this.logBehavior.execute(cmd, next),
      (cmd, next) => this.featureFlagBehavior.execute(cmd, next),
      (cmd, next) => this.validationBehavior.execute(cmd, next),
      (cmd, next) => this.cacheBehavior.execute(cmd, next),
      (cmd, next) => this.distributedLockBehavior.execute(cmd, next),
      (cmd, next) => this.transactionalBehavior.execute(cmd, next),
    ];

    this.queryBehaviors = [
      (cmd, next) => this.performanceBehavior.execute(cmd, next),
      (cmd, next) => this.logBehavior.execute(cmd, next),
      (cmd, next) => this.featureFlagBehavior.execute(cmd, next),
      (cmd, next) => this.validationBehavior.execute(cmd, next),
      (cmd, next) => this.cacheBehavior.execute(cmd, next),
    ];

    this.logger.log(
      `Pipeline initialized — commands: ${this.commandBehaviors.length} behaviors, queries: ${this.queryBehaviors.length} behaviors`,
    );
  }

  async executeCommand<T>(command: object): Promise<Result<T>> {
    const handler = () => this.commandBus.execute(command) as Promise<Result<T>>;
    return this.runPipeline(command, handler, this.commandBehaviors);
  }

  async executeQuery<T>(query: object): Promise<Result<T>> {
    const handler = () => this.queryBus.execute(query) as Promise<Result<T>>;
    return this.runPipeline(query, handler, this.queryBehaviors);
  }

  private runPipeline<T>(
    command: object,
    handler: () => Promise<Result<T>>,
    behaviors: BehaviorFn[],
  ): Promise<Result<T>> {
    let next = handler;

    for (let i = behaviors.length - 1; i >= 0; i--) {
      const behavior = behaviors[i];
      const currentNext = next;
      next = () => behavior(command, currentNext);
    }

    return next();
  }
}
