import { Result } from '../../result/Result';
import type { Redis } from 'ioredis';
export declare class CacheBehavior {
    private readonly redis?;
    private readonly logger;
    constructor(redis?: Redis | undefined);
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
    private interpolateKey;
}
