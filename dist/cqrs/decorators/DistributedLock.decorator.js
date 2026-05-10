"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedLock = DistributedLock;
exports.getDistributedLockMetadata = getDistributedLockMetadata;
require("reflect-metadata");
const LOCK_KEY = 'arex:distributed-lock';
/**
 * @DistributedLock('key:{prop}') — acquires a Redis distributed lock before execution.
 * Throws ConflictException on timeout.
 */
function DistributedLock(key, options = {}) {
    return (target) => {
        Reflect.defineMetadata(LOCK_KEY, {
            key,
            acquireTimeoutSeconds: 5,
            lockTtlSeconds: 30,
            ...options,
        }, target);
    };
}
function getDistributedLockMetadata(target) {
    return Reflect.getMetadata(LOCK_KEY, target);
}
