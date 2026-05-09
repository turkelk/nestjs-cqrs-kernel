import { Result } from '../../result/Result';
import type { Redis } from 'ioredis';
export declare class DistributedLockBehavior {
    private readonly redis?;
    private readonly logger;
    constructor(redis?: Redis | undefined);
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
    private tryAcquire;
    private release;
    private sleep;
    private interpolateKey;
}
//# sourceMappingURL=DistributedLockBehavior.d.ts.map