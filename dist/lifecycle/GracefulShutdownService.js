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
var GracefulShutdownService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GracefulShutdownService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const constants_1 = require("../cqrs/constants");
const SHUTDOWN_TIMEOUT_MS = 30_000;
/**
 * GracefulShutdownService ensures clean resource teardown on SIGTERM/SIGINT.
 *
 * Shutdown order:
 * 1. Wait for in-flight work (subclasses can override `drainWork`)
 * 2. Close database connections
 * 3. Quit Redis
 */
let GracefulShutdownService = GracefulShutdownService_1 = class GracefulShutdownService {
    dataSource;
    redis;
    logger = new common_1.Logger(GracefulShutdownService_1.name);
    constructor(dataSource, redis) {
        this.dataSource = dataSource;
        this.redis = redis;
    }
    async onModuleDestroy() {
        this.logger.log('Graceful shutdown initiated...');
        // 1. Drain in-flight work with timeout
        try {
            await this.withTimeout(this.drainWork(), SHUTDOWN_TIMEOUT_MS, 'Work drain');
        }
        catch (err) {
            this.logger.warn(`Work drain timeout or error: ${err.message}`);
        }
        // 2. Close database connections
        if (this.dataSource?.isInitialized) {
            try {
                await this.dataSource.destroy();
                this.logger.log('Database connections closed');
            }
            catch (err) {
                this.logger.warn(`Database close error: ${err.message}`);
            }
        }
        // 3. Quit Redis
        if (this.redis) {
            try {
                await this.redis.quit();
                this.logger.log('Redis connection closed');
            }
            catch (err) {
                this.logger.warn(`Redis quit error: ${err.message}`);
            }
        }
        this.logger.log('Graceful shutdown complete');
    }
    /**
     * Override in service-specific subclasses to drain Bull queues,
     * close Socket.IO servers, etc.
     */
    async drainWork() {
        // Base implementation — no-op
    }
    withTimeout(promise, ms, label) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`${label} timed out after ${ms}ms`));
            }, ms);
            promise
                .then(() => { clearTimeout(timer); resolve(); })
                .catch((err) => { clearTimeout(timer); reject(err); });
        });
    }
};
exports.GracefulShutdownService = GracefulShutdownService;
exports.GracefulShutdownService = GracefulShutdownService = GracefulShutdownService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [typeorm_1.DataSource, Function])
], GracefulShutdownService);
