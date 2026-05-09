import { Injectable, Logger, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Result, ErrorType } from '../../result/Result';
import { TransactionContext } from '../transaction/TransactionContext';
import { isIsolatedTransaction } from '../decorators/IsolatedTransaction.decorator';

/**
 * TransactionalBehavior — UnitOfWork pattern via AsyncLocalStorage.
 *
 * Every command is transactional by default (no decorator needed):
 * - If no ambient transaction exists → CREATE one, own commit/rollback
 * - If an ambient transaction exists → JOIN it (pass through, outer scope owns lifecycle)
 * - If command is @IsolatedTransaction() → always CREATE a new one, even if context exists
 *
 * Queries skip this behavior entirely (separate pipeline chain in PipelineExecutor).
 */
@Injectable()
export class TransactionalBehavior {
  private readonly logger = new Logger(TransactionalBehavior.name);

  constructor(@Optional() private readonly dataSource?: DataSource) {}

  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    if (!this.dataSource) {
      return next();
    }

    const existing = TransactionContext.get();
    const isolated = isIsolatedTransaction(command.constructor);

    // JOIN — ambient transaction exists and command does not demand isolation
    if (existing && !isolated) {
      return next();
    }

    // CREATE — we are the outermost scope (or isolated); we own the lifecycle
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await TransactionContext.run(queryRunner, () => next());

      if (result.isSuccess) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `Transaction rolled back for ${command.constructor.name}: ${result.errorMessage}`,
        );
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return Result.failure<T>(
        ErrorType.InternalError,
        `Transaction failed for ${command.constructor.name}: ${(error as Error).message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
