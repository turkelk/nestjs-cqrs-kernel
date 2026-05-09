"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OutboxPublisherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxPublisherService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const OutboxEvent_entity_1 = require("./OutboxEvent.entity");
const RedisStreamPublisher_1 = require("./RedisStreamPublisher");
const POLL_INTERVAL_MS = 100;
const BATCH_SIZE = 50;
const MAX_PUBLISH_ATTEMPTS = 5;
const DLQ_STREAM = 'arex:events:dlq';
let OutboxPublisherService = OutboxPublisherService_1 = class OutboxPublisherService {
    dataSource;
    redisPublisher;
    logger = new common_1.Logger(OutboxPublisherService_1.name);
    timer = null;
    processing = false;
    constructor(dataSource, redisPublisher) {
        this.dataSource = dataSource;
        this.redisPublisher = redisPublisher;
    }
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
    async pollAndPublish() {
        if (this.processing)
            return;
        this.processing = true;
        try {
            const repo = this.dataSource.getRepository(OutboxEvent_entity_1.OutboxEvent);
            const events = await repo.find({
                where: { status: OutboxEvent_entity_1.OutboxEventStatus.Pending },
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
                    event.status = OutboxEvent_entity_1.OutboxEventStatus.Published;
                    event.publishedAt = new Date();
                    await repo.save(event);
                }
                catch (error) {
                    event.publishAttempts += 1;
                    event.lastError = error.message;
                    if (event.publishAttempts >= MAX_PUBLISH_ATTEMPTS) {
                        event.status = OutboxEvent_entity_1.OutboxEventStatus.Failed;
                        this.logger.error(`Event ${event.id} exceeded max attempts, routing to DLQ`);
                        try {
                            await this.redisPublisher.publishToStream(DLQ_STREAM, {
                                eventId: event.id,
                                eventType: event.eventType,
                                aggregateId: event.aggregateId,
                                error: event.lastError || 'unknown',
                                payload: JSON.stringify(event.payload),
                            });
                        }
                        catch {
                            this.logger.error(`Failed to route event ${event.id} to DLQ`);
                        }
                    }
                    await repo.save(event);
                }
            }
        }
        catch (error) {
            this.logger.error('Outbox poll cycle failed', error.stack);
        }
        finally {
            this.processing = false;
        }
    }
};
exports.OutboxPublisherService = OutboxPublisherService;
exports.OutboxPublisherService = OutboxPublisherService = OutboxPublisherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        RedisStreamPublisher_1.RedisStreamPublisher])
], OutboxPublisherService);
//# sourceMappingURL=OutboxPublisherService.js.map