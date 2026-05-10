"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestingModuleFactory = exports.createMockRedisClient = exports.createMockRepository = void 0;
const testing_1 = require("@nestjs/testing");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const PipelineExecutor_1 = require("../cqrs/PipelineExecutor");
const LogBehavior_1 = require("../cqrs/behaviors/LogBehavior");
const ValidationBehavior_1 = require("../cqrs/behaviors/ValidationBehavior");
const CacheBehavior_1 = require("../cqrs/behaviors/CacheBehavior");
const DistributedLockBehavior_1 = require("../cqrs/behaviors/DistributedLockBehavior");
const TransactionalBehavior_1 = require("../cqrs/behaviors/TransactionalBehavior");
const PerformanceBehavior_1 = require("../cqrs/behaviors/PerformanceBehavior");
const MetricsService_1 = require("../metrics/MetricsService");
const constants_1 = require("../cqrs/constants");
const mocks_1 = require("./mocks");
Object.defineProperty(exports, "createMockRepository", { enumerable: true, get: function () { return mocks_1.createMockRepository; } });
Object.defineProperty(exports, "createMockRedisClient", { enumerable: true, get: function () { return mocks_1.createMockRedisClient; } });
/**
 * Factory for bootstrapping a NestJS TestingModule preconfigured
 * with mocked repositories, Redis, and optionally the CQRS pipeline.
 */
class TestingModuleFactory {
    static create(options = {}) {
        const { providers = [], entities = [], overrides = [], withPipeline = false } = options;
        const mockRepos = entities.map((entity) => ({
            provide: (0, typeorm_1.getRepositoryToken)(entity),
            useValue: (0, mocks_1.createMockRepository)(),
        }));
        const mockRedis = { provide: constants_1.REDIS_CLIENT, useValue: (0, mocks_1.createMockRedisClient)() };
        const pipelineProviders = withPipeline
            ? [
                LogBehavior_1.LogBehavior,
                ValidationBehavior_1.ValidationBehavior,
                CacheBehavior_1.CacheBehavior,
                DistributedLockBehavior_1.DistributedLockBehavior,
                TransactionalBehavior_1.TransactionalBehavior,
                PerformanceBehavior_1.PerformanceBehavior,
                MetricsService_1.MetricsService,
                PipelineExecutor_1.PipelineExecutor,
            ]
            : [];
        let builder = testing_1.Test.createTestingModule({
            imports: [cqrs_1.CqrsModule.forRoot()],
            providers: [
                ...mockRepos,
                mockRedis,
                ...pipelineProviders,
                ...providers,
            ],
        });
        for (const override of overrides) {
            builder = builder.overrideProvider(override.provide).useValue(override.useValue);
        }
        // Silence NestJS logs during tests
        common_1.Logger.overrideLogger(['error']);
        return builder;
    }
}
exports.TestingModuleFactory = TestingModuleFactory;
