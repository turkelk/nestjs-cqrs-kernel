import { AsyncLocalStorage } from 'async_hooks';
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
export class TransactionContext {
  private static readonly storage = new AsyncLocalStorage<QueryRunner>();

  /** Returns the active QueryRunner for this async scope, or undefined. */
  static get(): QueryRunner | undefined {
    return this.storage.getStore();
  }

  /** Runs `fn` with `queryRunner` as the ambient transaction for all nested calls. */
  static run<T>(queryRunner: QueryRunner, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(queryRunner, fn);
  }
}
