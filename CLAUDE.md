# shared-kernel

> Shared abstractions for all backend services — zero service-specific logic.

## Purpose

Provides cross-cutting concerns that every NestJS service imports: the Result pattern, base entities, pipeline behavior decorators, middleware, logging configuration, and feature flag integration. If it's service-specific, it does NOT belong here.

## Exports

### Result Pattern

```typescript
Result.success(value)                    // Success
Result.failure(ErrorType.NotFound, msg)  // Typed failure
Result.notFound(msg)                     // Shorthand
Result.forbidden(msg)                    // Shorthand
Result.conflict(msg)                     // Shorthand
Result.validationError(msg)              // Shorthand
Result.unauthorized(msg)                 // Shorthand
```

All command/query handlers return `Result<T>` — never throw for business errors.

### Base Entities

- `BaseEntity` — `id` (UUID v4), `createdAt`, `updatedAt`
- `TenantBaseEntity` extends BaseEntity — adds `organizationId` for RLS

### Middleware

- `CorrelationIdMiddleware` — generates/propagates `X-Correlation-ID` header per request
- `TenantContextMiddleware` — extracts `org_id` from JWT, sets TypeORM RLS (stub, implemented in Wave 4)

### Logging

- `createPinoConfig(serviceName)` — Pino config with Seq transport, PII serializers (email masking, token redaction, BRD truncation), correlation ID propagation

### CQRS Pipeline Behaviors

- `@FeatureFlag(flagName, options)` — gates commands via Unleash; fallback: throw/skip/default
- `@Validate(ValidatorClass)` — Zod validation via separate validator class
- `@IsolatedTransaction()` — opts out of ambient UnitOfWork (for audit logs, notifications)
- `TransactionalBehavior` — UnitOfWork pattern: all commands transactional by default
- `TransactionContext` — AsyncLocalStorage-based ambient transaction scope
- `getTransactionalRepo(repo)` — returns transaction-bound repository for handler DB access

### UnitOfWork Transaction Pattern

All commands are transactional by default. Nested commands share one ambient transaction.

```typescript
// Handler uses getTransactionalRepo — joins ambient transaction automatically
const itemRepo = getTransactionalRepo(this.itemRepo);
await itemRepo.save(entity);
```

- Outermost command creates the transaction, owns commit/rollback
- Nested commands join automatically (no decorator needed)
- `@IsolatedTransaction()` forces a new independent transaction
- Queries skip TransactionalBehavior entirely (separate pipeline chain)

### Unleash Integration

- `UnleashModule.forRoot(options?)` — global NestJS module, configurable via env vars
- `FEATURE_FLAGS` — constant map of flag names (`enable-premium-mode`, `enable-agency-plan`, `enable-backlog-generation`)

## Module Structure

```
src/
├── result/
│   └── Result.ts
├── entities/
│   ├── BaseEntity.ts
│   └── TenantBaseEntity.ts
├── middleware/
│   ├── CorrelationIdMiddleware.ts
│   └── TenantContextMiddleware.ts
├── logging/
│   └── pino-config.ts
├── cqrs/
│   ├── decorators/
│   │   ├── FeatureFlag.decorator.ts
│   │   ├── Validate.decorator.ts
│   │   ├── IsolatedTransaction.decorator.ts
│   │   └── ...
│   ├── behaviors/
│   │   ├── TransactionalBehavior.ts    # UnitOfWork: join/create via AsyncLocalStorage
│   │   ├── ValidationBehavior.ts       # Zod validation via ICommandValidator
│   │   ├── LogBehavior.ts             # Single structured log, auto-truncation
│   │   └── ...
│   ├── transaction/
│   │   ├── TransactionContext.ts       # AsyncLocalStorage<QueryRunner>
│   │   └── getTransactionalRepo.ts    # Handler helper for tx-bound repos
│   ├── validation/
│   │   └── ICommandValidator.ts       # Zod validation interface + helper
│   └── PipelineExecutor.ts            # Separate command/query behavior chains
├── unleash/
│   ├── unleash.module.ts
│   └── initial-flags.ts
└── index.ts                    # Barrel export — all public API
```

## Commands

```bash
npm run build -w src/shared-kernel    # Must build BEFORE services
npm run test -w src/shared-kernel
```

## Rules

- No service-specific logic — only cross-cutting concerns
- Every public type must be exported from `index.ts`
- Build shared-kernel first — all 4 services depend on `dist/`
