"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = Cache;
exports.getCacheMetadata = getCacheMetadata;
require("reflect-metadata");
const CACHE_KEY = 'arex:cache';
/**
 * @Cache('key:{prop}', { ttlSeconds: 60 }) — caches query results in Redis.
 * Reads from cache on hit; sets on miss with TTL.
 */
function Cache(key, options = {}) {
    return (target) => {
        Reflect.defineMetadata(CACHE_KEY, { key, ttlSeconds: 60, ...options }, target);
    };
}
function getCacheMetadata(target) {
    return Reflect.getMetadata(CACHE_KEY, target);
}
