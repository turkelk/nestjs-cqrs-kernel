import type { Redis } from 'ioredis';
import { DomainEvent } from './DomainEvent';
export declare class RedisStreamPublisher {
    private readonly redis?;
    private readonly logger;
    constructor(redis?: Redis | undefined);
    publish(event: DomainEvent): Promise<void>;
    publishToStream(streamKey: string, fields: Record<string, string>): Promise<string | null>;
}
//# sourceMappingURL=RedisStreamPublisher.d.ts.map