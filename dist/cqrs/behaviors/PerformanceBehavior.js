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
exports.PerformanceBehavior = void 0;
const common_1 = require("@nestjs/common");
const MetricsService_1 = require("../../metrics/MetricsService");
const SLOW_THRESHOLD_MS = 500;
/**
 * PerformanceBehavior logs a warning when a handler exceeds 500ms
 * and records handler duration in Prometheus histogram.
 */
let PerformanceBehavior = class PerformanceBehavior {
    metrics;
    logger = new common_1.Logger('PerformanceBehavior');
    constructor(metrics) {
        this.metrics = metrics;
    }
    async execute(command, next) {
        const handlerName = command.constructor.name;
        const startTime = Date.now();
        const result = await next();
        const durationMs = Date.now() - startTime;
        const durationSec = durationMs / 1000;
        const resultLabel = result.isSuccess ? 'success' : 'failure';
        // Record metrics
        this.metrics?.handlerDuration
            .labels(handlerName, resultLabel)
            .observe(durationSec);
        // Warn on slow handlers
        if (durationMs > SLOW_THRESHOLD_MS) {
            this.logger.warn({
                msg: `Slow handler detected: ${handlerName} took ${durationMs}ms`,
                handler: handlerName,
                durationMs,
            });
        }
        return result;
    }
};
exports.PerformanceBehavior = PerformanceBehavior;
exports.PerformanceBehavior = PerformanceBehavior = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [MetricsService_1.MetricsService])
], PerformanceBehavior);
