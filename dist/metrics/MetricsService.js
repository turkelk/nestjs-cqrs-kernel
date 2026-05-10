"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    registry = new prom_client_1.Registry();
    buildTotal = new prom_client_1.Counter({
        name: 'arex_build_total',
        help: 'Total number of builds',
        labelNames: ['status', 'tech_stack'],
        registers: [this.registry],
    });
    stageDuration = new prom_client_1.Histogram({
        name: 'arex_stage_duration_seconds',
        help: 'Duration of pipeline stages in seconds',
        labelNames: ['stage_type', 'status'],
        buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300],
        registers: [this.registry],
    });
    promptCacheHits = new prom_client_1.Counter({
        name: 'arex_prompt_cache_hits_total',
        help: 'Total prompt cache hits',
        registers: [this.registry],
    });
    queueDepth = new prom_client_1.Gauge({
        name: 'arex_queue_depth',
        help: 'Current depth of Bull job queue',
        labelNames: ['queue'],
        registers: [this.registry],
    });
    handlerDuration = new prom_client_1.Histogram({
        name: 'arex_handler_duration_seconds',
        help: 'Duration of command/query handlers in seconds',
        labelNames: ['handler', 'result'],
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
        registers: [this.registry],
    });
    onModuleInit() {
        (0, prom_client_1.collectDefaultMetrics)({ register: this.registry });
    }
    async getMetrics() {
        return this.registry.metrics();
    }
    getContentType() {
        return this.registry.contentType;
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
