import { Logger, Inject, Optional, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT } from '../cqrs/constants';
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
export abstract class RedisStreamConsumer implements OnModuleInit, OnModuleDestroy {
  protected readonly logger = new Logger(this.constructor.name);

  abstract readonly streamKey: string;
  abstract readonly consumerGroup: string;
  abstract readonly consumerName: string;

  /** Override to filter by eventType. Return true to process. Default: all messages. */
  protected shouldHandle(_fields: Record<string, string>): boolean {
    return true;
  }

  abstract handleMessage(fields: Record<string, string>): Promise<void>;

  private running = false;

  /** Dedicated connection for blocking XREADGROUP — cloned from shared client on init */
  private blockingClient?: Redis;

  constructor(
    @Optional() @Inject(REDIS_CLIENT) protected readonly redis?: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.redis) {
      this.logger.warn('Redis client not available — consumer disabled');
      return;
    }

    // Clone a dedicated connection for blocking reads.
    // This prevents XREADGROUP BLOCK from starving cache/lock/publish ops on the shared client.
    this.blockingClient = this.redis.duplicate();
    this.blockingClient.on('error', (err) =>
      this.logger.error(`Blocking client error on ${this.streamKey}: ${err.message}`),
    );

    // Create consumer group (idempotent) — uses shared client (non-blocking)
    try {
      await this.redis.xgroup(
        'CREATE',
        this.streamKey,
        this.consumerGroup,
        '0',
        'MKSTREAM',
      );
      this.logger.log(`Created consumer group "${this.consumerGroup}" on "${this.streamKey}"`);
    } catch (err: any) {
      if (!err.message?.includes('BUSYGROUP')) {
        throw err;
      }
      // Group already exists — fine
    }

    this.running = true;

    // Process pending messages first, then new ones
    // Run in background so NestJS startup isn't blocked
    void this.consumeLoop();
  }

  async onModuleDestroy(): Promise<void> {
    this.running = false;

    // Disconnect the dedicated blocking client
    if (this.blockingClient) {
      this.blockingClient.disconnect();
      this.blockingClient = undefined;
    }
  }

  private async consumeLoop(): Promise<void> {
    // Phase 1: recover pending (unacked) messages
    await this.readMessages('0');

    // Phase 2: read new messages
    while (this.running) {
      await this.readMessages('>');
    }
  }

  private async readMessages(id: '0' | '>'): Promise<void> {
    if (!this.redis || !this.blockingClient || !this.running) return;

    try {
      const blockMs = id === '>' ? 5000 : undefined;
      const args: (string | number)[] = [
        'GROUP',
        this.consumerGroup,
        this.consumerName,
        'COUNT',
        '10',
      ];
      if (blockMs !== undefined) {
        args.push('BLOCK', blockMs);
      }
      args.push('STREAMS', this.streamKey, id);

      // Use dedicated blocking client for XREADGROUP — never the shared REDIS_CLIENT
      const results = await (this.blockingClient as any).xreadgroup(...args) as
        Array<[string, Array<[string, string[]]>]> | null;

      if (!results || results.length === 0) {
        if (id === '0') return; // No pending — switch to new messages
        return;
      }

      const [, entries] = results[0];

      if (entries.length === 0 && id === '0') {
        return; // All pending recovered
      }

      for (const [messageId, fieldArray] of entries) {
        // Parse flat field array into Record
        const fields: Record<string, string> = {};
        for (let i = 0; i < fieldArray.length; i += 2) {
          fields[fieldArray[i]] = fieldArray[i + 1];
        }

        if (!this.shouldHandle(fields)) {
          // Ack and skip — uses shared client (non-blocking)
          await this.redis.xack(this.streamKey, this.consumerGroup, messageId);
          continue;
        }

        try {
          await this.handleMessage(fields);
          // XACK on shared client — non-blocking
          await this.redis.xack(this.streamKey, this.consumerGroup, messageId);
        } catch (err: any) {
          this.logger.error(
            `Failed to process message ${messageId} on ${this.streamKey}: ${err.message}`,
            err.stack,
          );
          // Don't ack — message stays pending for retry on next startup
        }
      }
    } catch (err: any) {
      if (!this.running) return; // Shutdown in progress
      this.logger.error(`Consumer read error on ${this.streamKey}: ${err.message}`, err.stack);
      // Back off before retrying
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
