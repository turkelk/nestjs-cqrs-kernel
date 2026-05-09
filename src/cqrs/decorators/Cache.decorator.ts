import 'reflect-metadata';

const CACHE_KEY = 'arex:cache';

export interface CacheOptions {
  /** Cache key template — use {propName} for interpolation, e.g. 'user:{id}' */
  key: string;
  /** TTL in seconds (default: 60) */
  ttlSeconds?: number;
}

/**
 * @Cache('key:{prop}', { ttlSeconds: 60 }) — caches query results in Redis.
 * Reads from cache on hit; sets on miss with TTL.
 */
export function Cache(key: string, options: Omit<CacheOptions, 'key'> = {}): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(CACHE_KEY, { key, ttlSeconds: 60, ...options }, target);
  };
}

export function getCacheMetadata(target: object): CacheOptions | undefined {
  return Reflect.getMetadata(CACHE_KEY, target);
}
