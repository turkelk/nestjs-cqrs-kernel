import type { QueryRunner } from 'typeorm';
/**
 * Ambient transaction context using AsyncLocalStorage.
 *
 * Node.js is single-threaded — each async chain (HTTP request, Bull job,
 * event consumer) gets its own isolated storage. Two concurrent requests
 * never share a QueryRunner.
 *
 * The TransactionalBehavior creates the context for the outermost command;
 * nested commands join automatically.
 */
export declare class TransactionContext {
    private static readonly storage;
    /** Returns the active QueryRunner for this async scope, or undefined. */
    static get(): QueryRunner | undefined;
    /** Runs `fn` with `queryRunner` as the ambient transaction for all nested calls. */
    static run<T>(queryRunner: QueryRunner, fn: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=TransactionContext.d.ts.map