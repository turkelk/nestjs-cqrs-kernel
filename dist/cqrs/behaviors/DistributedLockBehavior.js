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
var DistributedLockBehavior_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedLockBehavior = void 0;
const common_1 = require("@nestjs/common");
const DistributedLock_decorator_1 = require("../decorators/DistributedLock.decorator");
const Result_1 = require("../../result/Result");
const constants_1 = require("../constants");
const uuid_1 = require("uuid");
let DistributedLockBehavior = DistributedLockBehavior_1 = class DistributedLockBehavior {
    redis;
    logger = new common_1.Logger(DistributedLockBehavior_1.name);
    constructor(redis) {
        this.redis = redis;
    }
    async execute(command, next) {
        const metadata = (0, DistributedLock_decorator_1.getDistributedLockMetadata)(command.constructor);
        if (!metadata || !this.redis) {
            return next();
        }
        const lockKey = `lock:${this.interpolateKey(metadata.key, command)}`;
        const lockValue = (0, uuid_1.v4)();
        const acquired = await this.tryAcquire(lockKey, lockValue, metadata.lockTtlSeconds, metadata.acquireTimeoutSeconds);
        if (!acquired) {
            this.logger.warn(`Failed to acquire lock: ${lockKey}`);
            return Result_1.Result.failure(Result_1.ErrorType.Conflict, `Resource is locked: ${metadata.key}`);
        }
        try {
            return await next();
        }
        finally {
            await this.release(lockKey, lockValue);
        }
    }
    async tryAcquire(key, value, ttlSeconds, timeoutSeconds) {
        const deadline = Date.now() + timeoutSeconds * 1000;
        const retryDelay = 50;
        while (Date.now() < deadline) {
            const result = await this.redis.set(key, value, 'EX', ttlSeconds, 'NX');
            if (result === 'OK')
                return true;
            await this.sleep(retryDelay);
        }
        return false;
    }
    async release(key, value) {
        // Lua script ensures only the owner releases the lock
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        try {
            await this.redis.eval(script, 1, key, value);
        }
        catch {
            this.logger.warn(`Failed to release lock: ${key}`);
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    interpolateKey(template, command) {
        return template.replace(/\{(\w+)\}/g, (_, prop) => {
            const value = command[prop];
            return value != null ? String(value) : '';
        });
    }
};
exports.DistributedLockBehavior = DistributedLockBehavior;
exports.DistributedLockBehavior = DistributedLockBehavior = DistributedLockBehavior_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(constants_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [Function])
], DistributedLockBehavior);
