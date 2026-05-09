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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RedisStreamPublisher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStreamPublisher = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../cqrs/constants");
const MAX_STREAM_LENGTH = 10000;
let RedisStreamPublisher = RedisStreamPublisher_1 = class RedisStreamPublisher {
    redis;
    logger = new common_1.Logger(RedisStreamPublisher_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async publish(event) {
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
    async publishToStream(streamKey, fields) {
        if (!this.redis)
            return null;
        try {
            const messageId = await this.redis.xadd(streamKey, 'MAXLEN', '~', String(MAX_STREAM_LENGTH), '*', ...Object.entries(fields).flat());
            this.logger.debug(`Published to ${streamKey}: ${messageId}`);
            return messageId;
        }
        catch (error) {
            this.logger.error(`Failed to publish to ${streamKey}`, error.stack);
            throw error;
        }
    }
};
exports.RedisStreamPublisher = RedisStreamPublisher;
exports.RedisStreamPublisher = RedisStreamPublisher = RedisStreamPublisher_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Function])
], RedisStreamPublisher);
//# sourceMappingURL=RedisStreamPublisher.js.map