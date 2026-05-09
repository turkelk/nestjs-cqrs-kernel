"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
const uuid_1 = require("uuid");
class DomainEvent {
    eventType;
    aggregateId;
    payload;
    organizationId;
    eventId;
    occurredAt;
    constructor(eventType, aggregateId, payload, organizationId) {
        this.eventType = eventType;
        this.aggregateId = aggregateId;
        this.payload = payload;
        this.organizationId = organizationId;
        this.eventId = (0, uuid_1.v4)();
        this.occurredAt = new Date();
    }
    /** The Redis Stream key this event should be published to */
    get streamKey() {
        // e.g. 'build.completed' → 'arex:events:builds'
        const category = this.eventType.split('.')[0];
        return `arex:events:${category}s`;
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=DomainEvent.js.map