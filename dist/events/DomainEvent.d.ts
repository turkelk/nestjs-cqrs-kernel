export interface DomainEventPayload {
    [key: string]: unknown;
}
export declare class DomainEvent {
    readonly eventType: string;
    readonly aggregateId: string;
    readonly payload: DomainEventPayload;
    readonly organizationId?: string | undefined;
    readonly eventId: string;
    readonly occurredAt: Date;
    constructor(eventType: string, aggregateId: string, payload: DomainEventPayload, organizationId?: string | undefined);
    /** The Redis Stream key this event should be published to */
    get streamKey(): string;
}
