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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisStreamConsumer = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../cqrs/constants");
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
let RedisStreamConsumer = class RedisStreamConsumer {
    redis;
    logger = new common_1.Logger(this.constructor.name);
    /** Override to filter by eventType. Return true to process. Default: all messages. */
    shouldHandle(_fields) {
        return true;
    }
    running = false;
    /** Dedicated connection for blocking XREADGROUP — cloned from shared client on init */
    blockingClient;
    constructor(redis) {
        this.redis = redis;
    }
    async onModuleInit() {
        if (!this.redis) {
            this.logger.warn('Redis client not available — consumer disabled');
            return;
        }
        // Clone a dedicated connection for blocking reads.
        // This prevents XREADGROUP BLOCK from starving cache/lock/publish ops on the shared client.
        this.blockingClient = this.redis.duplicate();
        this.blockingClient.on('error', (err) => this.logger.error(`Blocking client error on ${this.streamKey}: ${err.message}`));
        // Create consumer group (idempotent) — uses shared client (non-blocking)
        try {
            await this.redis.xgroup('CREATE', this.streamKey, this.consumerGroup, '0', 'MKSTREAM');
            this.logger.log(`Created consumer group "${this.consumerGroup}" on "${this.streamKey}"`);
        }
        catch (err) {
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
    async onModuleDestroy() {
        this.running = false;
        // Disconnect the dedicated blocking client
        if (this.blockingClient) {
            this.blockingClient.disconnect();
            this.blockingClient = undefined;
        }
    }
    async consumeLoop() {
        // Phase 1: recover pending (unacked) messages
        await this.readMessages('0');
        // Phase 2: read new messages
        while (this.running) {
            await this.readMessages('>');
        }
    }
    async readMessages(id) {
        if (!this.redis || !this.blockingClient || !this.running)
            return;
        try {
            const blockMs = id === '>' ? 5000 : undefined;
            const args = [
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
            const results = await this.blockingClient.xreadgroup(...args);
            if (!results || results.length === 0) {
                if (id === '0')
                    return; // No pending — switch to new messages
                return;
            }
            const [, entries] = results[0];
            if (entries.length === 0 && id === '0') {
                return; // All pending recovered
            }
            for (const [messageId, fieldArray] of entries) {
                // Parse flat field array into Record
                const fields = {};
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
                }
                catch (err) {
                    this.logger.error(`Failed to process message ${messageId} on ${this.streamKey}: ${err.message}`, err.stack);
                    // Don't ack — message stays pending for retry on next startup
                }
            }
        }
        catch (err) {
            if (!this.running)
                return; // Shutdown in progress
            this.logger.error(`Consumer read error on ${this.streamKey}: ${err.message}`, err.stack);
            // Back off before retrying
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
};
exports.RedisStreamConsumer = RedisStreamConsumer;
exports.RedisStreamConsumer = RedisStreamConsumer = __decorate([
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Function])
], RedisStreamConsumer);
//# sourceMappingURL=RedisStreamConsumer.js.map