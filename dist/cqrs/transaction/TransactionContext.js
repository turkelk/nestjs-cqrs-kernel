"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionContext = void 0;
const async_hooks_1 = require("async_hooks");
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
class TransactionContext {
    static storage = new async_hooks_1.AsyncLocalStorage();
    /** Returns the active QueryRunner for this async scope, or undefined. */
    static get() {
        return this.storage.getStore();
    }
    /** Runs `fn` with `queryRunner` as the ambient transaction for all nested calls. */
    static run(queryRunner, fn) {
        return this.storage.run(queryRunner, fn);
    }
}
exports.TransactionContext = TransactionContext;
