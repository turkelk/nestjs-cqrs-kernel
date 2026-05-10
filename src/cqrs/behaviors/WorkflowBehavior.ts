import { Injectable, Optional, Inject, Logger } from '@nestjs/common';
import { getWorkflowMetadata } from '../decorators/Workflow.decorator';
import { WORKFLOW_ENGINE, WorkflowEngine } from '../interfaces/WorkflowEngine';
import { Result, ErrorType } from '../../result/Result';

@Injectable()
export class WorkflowBehavior {
  private readonly logger = new Logger(WorkflowBehavior.name);

  constructor(
    @Optional() @Inject(WORKFLOW_ENGINE)
    private readonly engine?: WorkflowEngine,
  ) {}

  async execute<T>(
    command: object,
    next: () => Promise<Result<T>>,
    context?: Map<string, unknown>,
  ): Promise<Result<T>> {
    const metadata = getWorkflowMetadata(command.constructor);

    if (!metadata) {
      return next();
    }

    if (!this.engine) {
      this.logger.debug('No WorkflowEngine provided, skipping workflow behavior');
      return next();
    }

    if (context?.get('workflow-phase') === 'execute') {
      return next();
    }

    try {
      const result = await this.engine.startProcess(
        metadata.processDefinitionId,
        command,
        { commandType: command.constructor.name },
      );
      return Result.success(result as unknown as T);
    } catch (error: any) {
      const fallback = metadata.fallback ?? 'throw';

      this.logger.warn(
        `Workflow start failed for "${metadata.processDefinitionId}", applying fallback: ${fallback}`,
        error.message,
      );

      switch (fallback) {
        case 'skip':
          return next();
        case 'queue':
          return Result.failure<T>(
            ErrorType.InternalError,
            `Workflow queuing not available without companion package: ${error.message}`,
          );
        case 'throw':
        default:
          return Result.failure<T>(
            ErrorType.InternalError,
            `Workflow start failed: ${error.message}`,
          );
      }
    }
  }
}
