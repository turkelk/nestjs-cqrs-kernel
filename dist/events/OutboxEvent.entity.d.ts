export declare enum OutboxEventStatus {
    Pending = "Pending",
    Published = "Published",
    Failed = "Failed"
}
export declare class OutboxEvent {
    id: string;
    eventType: string;
    aggregateId: string;
    streamKey: string;
    payload: Record<string, unknown>;
    organizationId: string | null;
    status: OutboxEventStatus;
    publishAttempts: number;
    lastError: string | null;
    createdAt: Date;
    publishedAt: Date | null;
}
