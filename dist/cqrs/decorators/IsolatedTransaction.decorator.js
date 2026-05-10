"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsolatedTransaction = IsolatedTransaction;
exports.isIsolatedTransaction = isIsolatedTransaction;
require("reflect-metadata");
const ISOLATED_TRANSACTION_KEY = 'arex:isolated-transaction';
/**
 * @IsolatedTransaction() — forces a command to run in its own dedicated transaction,
 * even when an outer transaction scope already exists.
 *
 * Use for operations that must commit independently of the parent flow:
 * - Audit logging (must persist even if the business operation rolls back)
 * - Notifications / side-effects that should not be lost on rollback
 *
 * By default all commands share the ambient transaction (UnitOfWork pattern).
 * This decorator opts out of that behavior.
 */
function IsolatedTransaction() {
    return (target) => {
        Reflect.defineMetadata(ISOLATED_TRANSACTION_KEY, true, target);
    };
}
function isIsolatedTransaction(target) {
    return Reflect.getMetadata(ISOLATED_TRANSACTION_KEY, target) === true;
}
