import 'reflect-metadata';
export interface DistributedLockOptions {
    /** Lock key template — use {propName} for interpolation */
    key: string;
    /** Max time to wait for lock acquisition in seconds (default: 5) */
    acquireTimeoutSeconds?: number;
    /** Lock auto-release time in seconds (default: 30) */
    lockTtlSeconds?: number;
}
/**
 * @DistributedLock('key:{prop}') — acquires a Redis distributed lock before execution.
 * Throws ConflictException on timeout.
 */
export declare function DistributedLock(key: string, options?: Omit<DistributedLockOptions, 'key'>): ClassDecorator;
export declare function getDistributedLockMetadata(target: object): DistributedLockOptions | undefined;
