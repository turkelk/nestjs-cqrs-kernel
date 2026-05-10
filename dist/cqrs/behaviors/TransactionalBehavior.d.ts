import { DataSource } from 'typeorm';
import { Result } from '../../result/Result';
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
export declare class TransactionalBehavior {
    private readonly dataSource?;
    private readonly logger;
    constructor(dataSource?: DataSource | undefined);
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
}
