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
var CacheBehavior_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheBehavior = void 0;
const common_1 = require("@nestjs/common");
const Cache_decorator_1 = require("../decorators/Cache.decorator");
const Result_1 = require("../../result/Result");
const constants_1 = require("../constants");
let CacheBehavior = CacheBehavior_1 = class CacheBehavior {
    redis;
    logger = new common_1.Logger(CacheBehavior_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async execute(command, next) {
        const metadata = (0, Cache_decorator_1.getCacheMetadata)(command.constructor);
        if (!metadata || !this.redis) {
            return next();
        }
        const cacheKey = this.interpolateKey(metadata.key, command);
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit: ${cacheKey}`);
                return Result_1.Result.success(JSON.parse(cached));
            }
        }
        catch {
            this.logger.warn(`Cache read failed for key: ${cacheKey}`);
        }
        const result = await next();
        if (result.isSuccess && result.value !== undefined) {
            try {
                await this.redis.set(cacheKey, JSON.stringify(result.value), 'EX', metadata.ttlSeconds);
                this.logger.debug(`Cache set: ${cacheKey} (TTL: ${metadata.ttlSeconds}s)`);
            }
            catch {
                this.logger.warn(`Cache write failed for key: ${cacheKey}`);
            }
        }
        return result;
    }
    interpolateKey(template, command) {
        return template.replace(/\{(\w+)\}/g, (_, prop) => {
            const value = command[prop];
            return value != null ? String(value) : '';
        });
    }
};
exports.CacheBehavior = CacheBehavior;
exports.CacheBehavior = CacheBehavior = CacheBehavior_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Function])
], CacheBehavior);
//# sourceMappingURL=CacheBehavior.js.map