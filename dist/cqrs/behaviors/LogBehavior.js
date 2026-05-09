"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogBehavior = void 0;
const common_1 = require("@nestjs/common");
const CorrelationStore_1 = require("../../middleware/CorrelationStore");
const PII_FIELDS = new Set(['email', 'githubAccessToken', 'accessToken', 'token', 'secretKey', 'password']);
const MAX_STRING_LENGTH = 200;
const MAX_ARRAY_LENGTH = 5;
const MAX_DEPTH = 2;
let LogBehavior = class LogBehavior {
    logger = new common_1.Logger('PipelineBehavior');
    async execute(command, next) {
        const commandName = command.constructor.name;
        const startTime = Date.now();
        const ctx = CorrelationStore_1.correlationStore.getStore();
        const logContext = {
            command: commandName,
            correlationId: ctx?.correlationId,
            userId: ctx?.userId,
            orgId: ctx?.organizationId,
            ...(this.extractBuildId(command)),
            payload: this.maskPayload(command),
        };
        try {
            const result = await next();
            const durationMs = Date.now() - startTime;
            if (result.isSuccess) {
                this.logger.log({
                    msg: `${commandName} completed`,
                    ...logContext,
                    durationMs,
                    result: 'success',
                });
            }
            else {
                this.logger.warn({
                    msg: `${commandName} completed`,
                    ...logContext,
                    durationMs,
                    result: 'failure',
                    errorType: result.errorType ?? 'Unknown',
                    errorMessage: result.errorMessage,
                });
            }
            return result;
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            this.logger.error({
                msg: `${commandName} completed`,
                ...logContext,
                durationMs,
                result: 'exception',
                error: error.message,
            });
            throw error;
        }
    }
    maskPayload(command) {
        const excludeFields = this.getExcludeFields(command);
        return this.sanitize(command, 0, excludeFields);
    }
    getExcludeFields(command) {
        const ctor = command.constructor;
        return new Set(ctor.logExclude ?? []);
    }
    sanitize(value, depth, excludeFields) {
        if (value === null || value === undefined)
            return value;
        if (typeof value === 'string') {
            return value.length > MAX_STRING_LENGTH
                ? `${value.substring(0, MAX_STRING_LENGTH)}... (${value.length} chars)`
                : value;
        }
        if (typeof value !== 'object')
            return value;
        if (depth >= MAX_DEPTH)
            return '[nested]';
        if (Array.isArray(value)) {
            if (value.length > MAX_ARRAY_LENGTH) {
                return [
                    ...value.slice(0, MAX_ARRAY_LENGTH).map((v) => this.sanitize(v, depth + 1)),
                    `... +${value.length - MAX_ARRAY_LENGTH} more`,
                ];
            }
            return value.map((v) => this.sanitize(v, depth + 1));
        }
        const masked = {};
        for (const [key, val] of Object.entries(value)) {
            if (excludeFields?.has(key)) {
                masked[key] = '[excluded]';
            }
            else if (PII_FIELDS.has(key)) {
                if (key === 'email' && typeof val === 'string') {
                    const [local, domain] = val.split('@');
                    masked[key] = domain ? `${local?.[0]}***@${domain}` : '[REDACTED]';
                }
                else {
                    masked[key] = '[REDACTED]';
                }
            }
            else {
                masked[key] = this.sanitize(val, depth + 1);
            }
        }
        return masked;
    }
    extractBuildId(command) {
        const buildId = command['buildId'];
        return typeof buildId === 'string' ? { buildId } : {};
    }
};
exports.LogBehavior = LogBehavior;
exports.LogBehavior = LogBehavior = __decorate([
    (0, common_1.Injectable)()
], LogBehavior);
//# sourceMappingURL=LogBehavior.js.map