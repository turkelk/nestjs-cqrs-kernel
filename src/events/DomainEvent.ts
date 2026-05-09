import { v4 as uuidv4 } from 'uuid';

export interface DomainEventPayload {
  [key: string]: unknown;
}

export class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly payload: DomainEventPayload,
    public readonly organizationId?: string,
  ) {
    this.eventId = uuidv4();
    this.occurredAt = new Date();
  }

  /** The Redis Stream key this event should be published to */
  get streamKey(): string {
    // e.g. 'build.completed' → 'arex:events:builds'
    const category = this.eventType.split('.')[0];
    return `arex:events:${category}s`;
  }
}
