import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OutboxEvent, OutboxEventStatus } from './OutboxEvent.entity';
import { RedisStreamPublisher } from './RedisStreamPublisher';

const POLL_INTERVAL_MS = 100;
const BATCH_SIZE = 50;
const MAX_PUBLISH_ATTEMPTS = 5;
const DLQ_STREAM = 'arex:events:dlq';

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private processing = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly redisPublisher: RedisStreamPublisher,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => this.pollAndPublish(), POLL_INTERVAL_MS);
    this.logger.log(`Outbox publisher started (${POLL_INTERVAL_MS}ms poll interval)`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.logger.log('Outbox publisher stopped');
  }

  private async pollAndPublish(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const repo = this.dataSource.getRepository(OutboxEvent);

      const events = await repo.find({
        where: { status: OutboxEventStatus.Pending },
        order: { createdAt: 'ASC' },
        take: BATCH_SIZE,
      });

      for (const event of events) {
        try {
          await this.redisPublisher.publishToStream(event.streamKey, {
            eventId: event.id,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            organizationId: event.organizationId || '',
            payload: JSON.stringify(event.payload),
            occurredAt: event.createdAt.toISOString(),
          });

          event.status = OutboxEventStatus.Published;
          event.publishedAt = new Date();
          await repo.save(event);
        } catch (error) {
          event.publishAttempts += 1;
          event.lastError = (error as Error).message;

          if (event.publishAttempts >= MAX_PUBLISH_ATTEMPTS) {
            event.status = OutboxEventStatus.Failed;
            this.logger.error(
              `Event ${event.id} exceeded max attempts, routing to DLQ`,
            );

            try {
              await this.redisPublisher.publishToStream(DLQ_STREAM, {
                eventId: event.id,
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                error: event.lastError || 'unknown',
                payload: JSON.stringify(event.payload),
              });
            } catch {
              this.logger.error(`Failed to route event ${event.id} to DLQ`);
            }
          }

          await repo.save(event);
        }
      }
    } catch (error) {
      this.logger.error('Outbox poll cycle failed', (error as Error).stack);
    } finally {
      this.processing = false;
    }
  }
}
