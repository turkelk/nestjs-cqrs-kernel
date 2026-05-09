import 'reflect-metadata';
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
export declare function Cache(key: string, options?: Omit<CacheOptions, 'key'>): ClassDecorator;
export declare function getCacheMetadata(target: object): CacheOptions | undefined;
//# sourceMappingURL=Cache.decorator.d.ts.map