// Result
export { Result, ErrorType } from './result/Result';

// Entities
export { BaseEntity } from './entities/BaseEntity';
export { TenantBaseEntity } from './entities/TenantBaseEntity';

// Middleware
export { CorrelationIdMiddleware } from './middleware/CorrelationIdMiddleware';
export { correlationStore } from './middleware/CorrelationStore';
export type { CorrelationStoreData } from './middleware/CorrelationStore';
export { TenantContextMiddleware, TenantContext } from './middleware/TenantContextMiddleware';
export { tenantStore } from './middleware/TenantStore';
export type { TenantStoreData } from './middleware/TenantStore';

// Filters
export { GlobalExceptionFilter } from './filters/GlobalExceptionFilter';

// Interceptors
export { ResultInterceptor } from './interceptors/ResultInterceptor';

// Guards
export { JwtAuthGuard, Public } from './guards/JwtAuthGuard';
export { JwtStrategy, JwtPayload } from './guards/JwtStrategy';
export { RolesGuard, Roles } from './guards/RolesGuard';

// Subscribers
export { TenantSubscriber } from './subscribers/TenantSubscriber';

// Resilience
export { createCircuitBreaker } from './resilience/CircuitBreakerFactory';
export type { CircuitBreakerOptions } from './resilience/CircuitBreakerFactory';

// Bootstrap
export { bootstrapService } from './bootstrap/bootstrapService';
export type { BootstrapOptions } from './bootstrap/bootstrapService';

// Logging
export { createPinoConfig } from './logging/pino-config';

// CQRS Constants
export { REDIS_CLIENT } from './cqrs/constants';

// CQRS Decorators
export { FeatureFlag, getFeatureFlagMetadata } from './cqrs/decorators/FeatureFlag.decorator';
export type { FeatureFlagOptions } from './cqrs/decorators/FeatureFlag.decorator';
export { Log, getLogMetadata } from './cqrs/decorators/Log.decorator';
export type { LogOptions } from './cqrs/decorators/Log.decorator';
export { Validate, shouldValidate, getValidatorClass } from './cqrs/decorators/Validate.decorator';

// Validation
export type { ICommandValidator } from './cqrs/validation/ICommandValidator';
export { validateCommand } from './cqrs/validation/ICommandValidator';
export { Cache, getCacheMetadata } from './cqrs/decorators/Cache.decorator';
export type { CacheOptions } from './cqrs/decorators/Cache.decorator';
export { DistributedLock, getDistributedLockMetadata } from './cqrs/decorators/DistributedLock.decorator';
export type { DistributedLockOptions } from './cqrs/decorators/DistributedLock.decorator';
export { IsolatedTransaction, isIsolatedTransaction } from './cqrs/decorators/IsolatedTransaction.decorator';
export { Workflow, getWorkflowMetadata } from './cqrs/decorators/Workflow.decorator';
export type { WorkflowOptions } from './cqrs/decorators/Workflow.decorator';

// Workflow Engine Interface
export { WORKFLOW_ENGINE } from './cqrs/interfaces/WorkflowEngine';
export type { WorkflowEngine, WorkflowStartResult } from './cqrs/interfaces/WorkflowEngine';

// Transaction (UnitOfWork)
export { TransactionContext } from './cqrs/transaction/TransactionContext';
export { getTransactionalRepo } from './cqrs/transaction/getTransactionalRepo';

// Metrics
export { MetricsService } from './metrics/MetricsService';
export { MetricsController } from './metrics/MetricsController';

// CQRS Behaviors
export { LogBehavior } from './cqrs/behaviors/LogBehavior';
export { FeatureFlagBehavior } from './cqrs/behaviors/FeatureFlagBehavior';
export { ValidationBehavior } from './cqrs/behaviors/ValidationBehavior';
export { CacheBehavior } from './cqrs/behaviors/CacheBehavior';
export { DistributedLockBehavior } from './cqrs/behaviors/DistributedLockBehavior';
export { TransactionalBehavior } from './cqrs/behaviors/TransactionalBehavior';
export { PerformanceBehavior } from './cqrs/behaviors/PerformanceBehavior';
export { WorkflowBehavior } from './cqrs/behaviors/WorkflowBehavior';

// CQRS Pipeline
export { PipelineExecutor } from './cqrs/PipelineExecutor';

// Redis
export { RedisModule } from './redis/redis.module';
export type { RedisModuleOptions } from './redis/redis.module';

// Events
export { DomainEvent } from './events/DomainEvent';
export type { DomainEventPayload } from './events/DomainEvent';
export { OutboxEvent, OutboxEventStatus } from './events/OutboxEvent.entity';
export { RedisStreamPublisher } from './events/RedisStreamPublisher';
export { RedisStreamConsumer } from './events/RedisStreamConsumer';
export { OutboxPublisherService } from './events/OutboxPublisherService';

// Unleash
export { UnleashModule } from './unleash/unleash.module';
export type { UnleashModuleOptions } from './unleash/unleash.module';

// Lifecycle
export { GracefulShutdownService } from './lifecycle/GracefulShutdownService';

// SharedKernelModule
export { SharedKernelModule } from './shared-kernel.module';
export type { SharedKernelModuleOptions } from './shared-kernel.module';

// Testing mock helpers (safe for prod — no @nestjs/testing dependency)
export { createMockRepository, createMockRedisClient } from './testing/mocks';


