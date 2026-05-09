import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { REDIS_CLIENT } from '../cqrs/constants';
import type { Redis } from 'ioredis';
import { DomainEvent } from './DomainEvent';

const MAX_STREAM_LENGTH = 10000;

@Injectable()
export class RedisStreamPublisher {
  private readonly logger = new Logger(RedisStreamPublisher.name);

  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    if (!this.redis) {
      this.logger.warn('Redis client not available, skipping event publish');
      return;
    }

    await this.publishToStream(event.streamKey, {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      organizationId: event.organizationId || '',
      payload: JSON.stringify(event.payload),
      occurredAt: event.occurredAt.toISOString(),
    });
  }

  async publishToStream(
    streamKey: string,
    fields: Record<string, string>,
  ): Promise<string | null> {
    if (!this.redis) return null;

    try {
      const messageId = await this.redis.xadd(
        streamKey,
        'MAXLEN',
        '~',
        String(MAX_STREAM_LENGTH),
        '*',
        ...Object.entries(fields).flat(),
      );
      this.logger.debug(`Published to ${streamKey}: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Failed to publish to ${streamKey}`, (error as Error).stack);
      throw error;
    }
  }
}
