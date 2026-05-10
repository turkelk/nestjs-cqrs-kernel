import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
/**
 * Abstract base class for Redis Stream consumer groups.
 *
 * Subclasses declare `streamKey`, `consumerGroup`, `consumerName`
 * and implement `handleMessage(fields)`.
 *
 * Lifecycle:
 *  - OnModuleInit: creates consumer group (idempotent), starts read loop
 *  - OnModuleDestroy: stops the read loop gracefully, disconnects dedicated client
 *
 * Connection strategy:
 *  - Shared REDIS_CLIENT: used for non-blocking ops (XGROUP CREATE, XACK)
 *  - Dedicated cloned connection: used ONLY for blocking XREADGROUP BLOCK calls
 *  - This prevents blocking consumers from starving non-blocking callers
 *    (cache, distributed locks, publishers) that share the main REDIS_CLIENT.
 *
 * Features:
 *  - Auto-creates consumer group via XGROUP CREATE ... MKSTREAM
 *  - Recovers pending (unacked) messages on startup before reading new ones
 *  - XREADGROUP BLOCK for efficient new-message polling (on dedicated connection)
 *  - XACK after successful processing (on shared connection)
 *  - Graceful shutdown (finishes in-flight message, disconnects dedicated client)
 */
export declare abstract class RedisStreamConsumer implements OnModuleInit, OnModuleDestroy {
    protected readonly redis?: Redis | undefined;
    protected readonly logger: Logger;
    abstract readonly streamKey: string;
    abstract readonly consumerGroup: string;
    abstract readonly consumerName: string;
    /** Override to filter by eventType. Return true to process. Default: all messages. */
    protected shouldHandle(_fields: Record<string, string>): boolean;
    abstract handleMessage(fields: Record<string, string>): Promise<void>;
    private running;
    /** Dedicated connection for blocking XREADGROUP — cloned from shared client on init */
    private blockingClient?;
    constructor(redis?: Redis | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private consumeLoop;
    private readMessages;
}
