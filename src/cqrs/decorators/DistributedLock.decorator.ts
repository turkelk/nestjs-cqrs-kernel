import 'reflect-metadata';

const LOCK_KEY = 'arex:distributed-lock';

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
export function DistributedLock(
  key: string,
  options: Omit<DistributedLockOptions, 'key'> = {},
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(LOCK_KEY, {
      key,
      acquireTimeoutSeconds: 5,
      lockTtlSeconds: 30,
      ...options,
    }, target);
  };
}

export function getDistributedLockMetadata(target: object): DistributedLockOptions | undefined {
  return Reflect.getMetadata(LOCK_KEY, target);
}
