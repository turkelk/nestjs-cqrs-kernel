"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SharedKernelModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedKernelModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const PipelineExecutor_1 = require("./cqrs/PipelineExecutor");
const LogBehavior_1 = require("./cqrs/behaviors/LogBehavior");
const FeatureFlagBehavior_1 = require("./cqrs/behaviors/FeatureFlagBehavior");
const ValidationBehavior_1 = require("./cqrs/behaviors/ValidationBehavior");
const CacheBehavior_1 = require("./cqrs/behaviors/CacheBehavior");
const DistributedLockBehavior_1 = require("./cqrs/behaviors/DistributedLockBehavior");
const TransactionalBehavior_1 = require("./cqrs/behaviors/TransactionalBehavior");
const PerformanceBehavior_1 = require("./cqrs/behaviors/PerformanceBehavior");
const WorkflowBehavior_1 = require("./cqrs/behaviors/WorkflowBehavior");
const MetricsService_1 = require("./metrics/MetricsService");
const MetricsController_1 = require("./metrics/MetricsController");
const GracefulShutdownService_1 = require("./lifecycle/GracefulShutdownService");
const RedisStreamPublisher_1 = require("./events/RedisStreamPublisher");
const redis_module_1 = require("./redis/redis.module");
const unleash_module_1 = require("./unleash/unleash.module");
/**
 * SharedKernelModule bundles all cross-cutting CQRS pipeline behaviors,
 * Redis, Unleash, and the PipelineExecutor into a single importable module.
 *
 * All 4 microservices should import this module to get the full behavior chains:
 *   Commands: Log → FeatureFlag → Validate → Cache → DistributedLock → Transactional → Handler
 *   Queries:  Log → FeatureFlag → Validate → Cache → Handler
 *
 * Every command is transactional by default (UnitOfWork pattern).
 * Use @IsolatedTransaction() to opt out of ambient transaction joining.
 */
let SharedKernelModule = SharedKernelModule_1 = class SharedKernelModule {
    static forRoot(options = {}) {
        const imports = [
            cqrs_1.CqrsModule.forRoot(),
            redis_module_1.RedisModule.forRoot(options.redis),
        ];
        if (options.unleash !== false) {
            imports.push(unleash_module_1.UnleashModule.forRoot(options.unleash));
        }
        const exports = [
            cqrs_1.CqrsModule,
            redis_module_1.RedisModule,
            RedisStreamPublisher_1.RedisStreamPublisher,
            LogBehavior_1.LogBehavior,
            FeatureFlagBehavior_1.FeatureFlagBehavior,
            ValidationBehavior_1.ValidationBehavior,
            CacheBehavior_1.CacheBehavior,
            DistributedLockBehavior_1.DistributedLockBehavior,
            TransactionalBehavior_1.TransactionalBehavior,
            PerformanceBehavior_1.PerformanceBehavior,
            WorkflowBehavior_1.WorkflowBehavior,
            MetricsService_1.MetricsService,
            GracefulShutdownService_1.GracefulShutdownService,
            PipelineExecutor_1.PipelineExecutor,
        ];
        if (options.unleash !== false) {
            exports.push(unleash_module_1.UnleashModule);
        }
        return {
            module: SharedKernelModule_1,
            imports,
            controllers: [MetricsController_1.MetricsController],
            providers: [
                LogBehavior_1.LogBehavior,
                FeatureFlagBehavior_1.FeatureFlagBehavior,
                ValidationBehavior_1.ValidationBehavior,
                CacheBehavior_1.CacheBehavior,
                DistributedLockBehavior_1.DistributedLockBehavior,
                TransactionalBehavior_1.TransactionalBehavior,
                PerformanceBehavior_1.PerformanceBehavior,
                WorkflowBehavior_1.WorkflowBehavior,
                MetricsService_1.MetricsService,
                GracefulShutdownService_1.GracefulShutdownService,
                RedisStreamPublisher_1.RedisStreamPublisher,
                PipelineExecutor_1.PipelineExecutor,
            ],
            exports,
        };
    }
};
exports.SharedKernelModule = SharedKernelModule;
exports.SharedKernelModule = SharedKernelModule = SharedKernelModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], SharedKernelModule);
