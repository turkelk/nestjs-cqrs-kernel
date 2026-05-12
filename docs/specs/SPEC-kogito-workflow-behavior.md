# Feature: Kogito Workflow Behavior

## Problem

The kernel currently executes all command handlers synchronously within the pipeline. Some business operations require orchestration through multi-step workflows (approvals, long-running processes, human tasks) managed by an external BPMN engine. There is no mechanism to defer command execution to a workflow engine and resume it upon workflow progression or completion.

## Solution

Split across **two packages**:

### Package 1: `@turkelk/quanticjs` (this repo)

Adds minimal workflow infrastructure to the pipeline:
- `@Workflow()` decorator (metadata only)
- `WorkflowEngine` interface (abstraction over any workflow runtime)
- `WorkflowBehavior` (optional pipeline behavior that delegates to a `WorkflowEngine` if provided)
- Pipeline context support (`Map<string, unknown>`) on `executeCommand`

### Package 2: `@turkelk/nestjs-cqrs-workflow` (new repo)

Kogito-specific implementation:
- `KogitoClient` — HTTP client for Kogito REST API
- `KogitoWorkflowEngine` — implements `WorkflowEngine` interface
- `WorkflowCallbackController` — HTTP webhook endpoint
- `WorkflowInstance` TypeORM entity — persistence/correlation
- `CancelWorkflowCommand` + handler
- `WorkflowModule.forRoot({ url, ... })` — provides the `WorkflowEngine` token
- Domain events

### Flow

When a command is decorated with `@Workflow('process-definition-id')`:

1. **WorkflowBehavior** (in kernel) detects the decorator and delegates to the injected `WorkflowEngine`
2. **KogitoWorkflowEngine** (in companion package) starts a Kogito process instance with the full command payload
3. The behavior **short-circuits** — handler does NOT execute
4. Returns `Result.success({ workflowInstanceId, processInstanceId, status: 'STARTED' })`

Later, when Kogito calls back:

5. **WorkflowCallbackController** (in companion package) receives the HTTP callback
6. Finds the `WorkflowInstance`, deserializes the original command
7. Re-dispatches the command via `PipelineExecutor` with context `{ 'workflow-phase': 'execute' }`
8. **WorkflowBehavior** sees the context flag and passes through to the actual handler

## Acceptance Criteria

### Kernel (`@turkelk/quanticjs`)

- [ ] `@Workflow('process-id')` decorator stores process definition ID in metadata
- [ ] `WorkflowEngine` interface defines: `startProcess`, `signalProcess`, `abortProcess`
- [ ] `WorkflowBehavior` short-circuits decorated commands by delegating to `WorkflowEngine`
- [ ] `WorkflowBehavior` passes through when pipeline context has `workflow-phase: 'execute'`
- [ ] `WorkflowBehavior` skips entirely if no `WorkflowEngine` is injected (graceful degradation)
- [ ] `PipelineExecutor.executeCommand` accepts optional `context: Map<string, unknown>`
- [ ] Context is threaded through the entire behavior chain
- [ ] `WorkflowBehavior` is placed after Validation but before Cache in the command pipeline
- [ ] `WorkflowStartedDto` type is exported for consumers

### Companion Package (`@turkelk/nestjs-cqrs-workflow`)

- [ ] `KogitoClient` wraps Kogito REST API (start, signal, abort)
- [ ] `KogitoWorkflowEngine` implements `WorkflowEngine` interface
- [ ] `WorkflowModule.forRoot({ url, fallback, requestTimeout })` provides engine + controller + entity
- [ ] `WorkflowCallbackController` exposes `POST /workflows/callback`
- [ ] Callback re-dispatches original command with pipeline context `workflow-phase: 'execute'`
- [ ] Intermediate callbacks supported: payload includes `commandType` for routing
- [ ] `WorkflowInstance` entity persists: processInstanceId, commandType, payload, status, correlationId
- [ ] Status lifecycle: STARTED → IN_PROGRESS → COMPLETED / FAILED / ABORTED
- [ ] `CancelWorkflowCommand` aborts Kogito process and marks entity ABORTED
- [ ] Configurable fallback when Kogito unavailable: `'throw'`, `'skip'`, `'queue'`
- [ ] Orphan callbacks (no matching WorkflowInstance) return HTTP 404 + log warning
- [ ] Duplicate callbacks on completed workflows return HTTP 200 (idempotent no-op)

## Technical Design

### Package 1: Kernel Changes

#### Affected Files

| File | Change |
|---|---|
| `src/cqrs/decorators/Workflow.decorator.ts` | New — decorator + metadata reader |
| `src/cqrs/behaviors/WorkflowBehavior.ts` | New — optional pipeline behavior |
| `src/cqrs/interfaces/WorkflowEngine.ts` | New — engine abstraction |
| `src/cqrs/PipelineExecutor.ts` | Add context param, add WorkflowBehavior to chain |
| `src/shared-kernel.module.ts` | Register WorkflowBehavior (optional) |
| `src/index.ts` | Export new types |

#### WorkflowEngine Interface

```typescript
export const WORKFLOW_ENGINE = Symbol('WORKFLOW_ENGINE');

export interface WorkflowStartResult {
  workflowInstanceId: string;
  processInstanceId: string;
  status: 'STARTED';
}

export interface WorkflowEngine {
  startProcess(
    processDefinitionId: string,
    command: object,
    metadata: { commandType: string; correlationId?: string },
  ): Promise<WorkflowStartResult>;

  signalProcess(processInstanceId: string, signal: string, data?: unknown): Promise<void>;

  abortProcess(processInstanceId: string): Promise<void>;
}
```

#### @Workflow Decorator

```typescript
const WORKFLOW_KEY = 'arex:workflow';

export interface WorkflowOptions {
  fallback?: 'throw' | 'skip' | 'queue';
}

export function Workflow(
  processDefinitionId: string,
  options?: WorkflowOptions,
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(WORKFLOW_KEY, { processDefinitionId, ...options }, target);
  };
}

export function getWorkflowMetadata(target: object):
  | { processDefinitionId: string } & WorkflowOptions
  | undefined {
  return Reflect.getMetadata(WORKFLOW_KEY, target);
}
```

#### WorkflowBehavior

```typescript
@Injectable()
export class WorkflowBehavior {
  constructor(
    @Optional() @Inject(WORKFLOW_ENGINE)
    private readonly engine?: WorkflowEngine,
  ) {}

  async execute<T>(
    command: object,
    next: () => Promise<Result<T>>,
    context?: Map<string, unknown>,
  ): Promise<Result<T>> {
    const metadata = getWorkflowMetadata(command.constructor);

    if (!metadata) return next();
    if (!this.engine) return next();
    if (context?.get('workflow-phase') === 'execute') return next();

    try {
      const result = await this.engine.startProcess(
        metadata.processDefinitionId,
        command,
        { commandType: command.constructor.name },
      );
      return Result.success(result as unknown as T);
    } catch (error) {
      const fallback = metadata.fallback ?? 'throw';
      switch (fallback) {
        case 'skip': return next();
        case 'queue': /* delegate to engine.queue() or outbox */ throw error;
        case 'throw':
        default:
          return Result.failure<T>(ErrorType.InternalError, `Workflow start failed: ${error.message}`);
      }
    }
  }
}
```

#### PipelineExecutor Changes

```typescript
// Signature change
type BehaviorFn = <T>(
  command: object,
  next: () => Promise<Result<T>>,
  context?: Map<string, unknown>,
) => Promise<Result<T>>;

async executeCommand<T>(command: object, context?: Map<string, unknown>): Promise<Result<T>> {
  const handler = () => this.commandBus.execute(command) as Promise<Result<T>>;
  return this.runPipeline(command, handler, this.commandBehaviors, context);
}

// Pipeline order (commands):
// Performance → Log → FeatureFlag → Validate → Workflow → Cache → DistributedLock → Transactional → Handler
```

#### Kernel Public API Additions

```typescript
export { Workflow, getWorkflowMetadata, WorkflowOptions } from './cqrs/decorators/Workflow.decorator';
export { WorkflowEngine, WorkflowStartResult, WORKFLOW_ENGINE } from './cqrs/interfaces/WorkflowEngine';
export { WorkflowBehavior } from './cqrs/behaviors/WorkflowBehavior';
```

---

### Package 2: Companion Package (`@turkelk/nestjs-cqrs-workflow`)

#### Structure

```
nestjs-cqrs-workflow/
├── src/
│   ├── KogitoClient.ts              # HTTP client for Kogito REST API
│   ├── KogitoWorkflowEngine.ts      # Implements WorkflowEngine interface
│   ├── WorkflowCallbackController.ts # HTTP webhook endpoint
│   ├── WorkflowInstance.entity.ts    # TypeORM entity
│   ├── WorkflowStatus.enum.ts       # Status enum
│   ├── CancelWorkflowCommand.ts     # Command + handler
│   ├── workflow.module.ts            # Dynamic module
│   └── index.ts                      # Public API
├── package.json
└── tsconfig.json
```

#### Dependencies

```json
{
  "peerDependencies": {
    "@turkelk/quanticjs": "^x.x.x",
    "@nestjs/common": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0"
  },
  "dependencies": {
    "@nestjs/axios": "^3.0.0",
    "axios": "^1.6.0"
  }
}
```

#### WorkflowModule

```typescript
export interface WorkflowModuleOptions {
  url: string;                            // Kogito runtime base URL
  requestTimeout?: number;                // HTTP timeout in ms (default: 10000)
  fallback?: 'throw' | 'skip' | 'queue'; // Default fallback (default: 'throw')
}

@Module({})
export class WorkflowModule {
  static forRoot(options: WorkflowModuleOptions): DynamicModule {
    return {
      module: WorkflowModule,
      imports: [
        HttpModule.register({ baseURL: options.url, timeout: options.requestTimeout ?? 10000 }),
        TypeOrmModule.forFeature([WorkflowInstance]),
      ],
      controllers: [WorkflowCallbackController],
      providers: [
        { provide: 'WORKFLOW_MODULE_OPTIONS', useValue: options },
        KogitoClient,
        {
          provide: WORKFLOW_ENGINE,   // from kernel
          useClass: KogitoWorkflowEngine,
        },
        CancelWorkflowHandler,
      ],
      exports: [WORKFLOW_ENGINE, KogitoClient],
    };
  }
}
```

#### WorkflowInstance Entity

```typescript
@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  processDefinitionId: string;

  @Column({ nullable: true })
  processInstanceId: string;

  @Column()
  commandType: string;

  @Column('jsonb')
  commandPayload: Record<string, unknown>;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.STARTED })
  status: WorkflowStatus;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true, type: 'jsonb' })
  processVariables: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}

export enum WorkflowStatus {
  STARTED = 'STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
}
```

#### KogitoClient

```typescript
@Injectable()
export class KogitoClient {
  constructor(private readonly httpService: HttpService) {}

  async startProcess(processId: string, variables: Record<string, unknown>): Promise<{ id: string }>;
  async signalProcess(processId: string, instanceId: string, signal: string, data?: unknown): Promise<void>;
  async abortProcess(processId: string, instanceId: string): Promise<void>;
  async getProcessInstance(processId: string, instanceId: string): Promise<KogitoProcessInstance>;
}
```

#### KogitoWorkflowEngine

```typescript
@Injectable()
export class KogitoWorkflowEngine implements WorkflowEngine {
  constructor(
    private readonly kogitoClient: KogitoClient,
    private readonly workflowInstanceRepo: Repository<WorkflowInstance>,
  ) {}

  async startProcess(processDefinitionId, command, metadata): Promise<WorkflowStartResult> {
    // 1. Call kogitoClient.startProcess
    // 2. Persist WorkflowInstance entity
    // 3. Return { workflowInstanceId, processInstanceId, status: 'STARTED' }
  }

  async signalProcess(processInstanceId, signal, data): Promise<void> { ... }
  async abortProcess(processInstanceId): Promise<void> { ... }
}
```

#### WorkflowCallbackController

```typescript
@Controller('workflows')
export class WorkflowCallbackController {
  constructor(
    private readonly pipelineExecutor: PipelineExecutor,
    private readonly workflowInstanceRepo: Repository<WorkflowInstance>,
  ) {}

  @Post('callback')
  async handleCallback(@Body() payload: WorkflowCallbackPayload): Promise<void> {
    // 1. Find WorkflowInstance by processInstanceId
    // 2. If not found → throw NotFoundException (404) + log warning
    // 3. If already COMPLETED/ABORTED → return 200 (idempotent no-op)
    // 4. Reconstruct command from commandType + commandPayload
    // 5. Update status (IN_PROGRESS or COMPLETED based on payload.status)
    // 6. Re-dispatch: pipelineExecutor.executeCommand(command, new Map([['workflow-phase', 'execute']]))
    // 7. On handler failure → update status to FAILED, rethrow
  }
}
```

#### Callback Payload Contract

```typescript
interface WorkflowCallbackPayload {
  processInstanceId: string;
  processDefinitionId: string;
  commandType: string;
  nodeId?: string;
  variables: Record<string, unknown>;
  status: 'ACTIVE' | 'COMPLETED' | 'ERROR';
}
```

#### CancelWorkflowCommand

```typescript
export class CancelWorkflowCommand {
  constructor(public readonly workflowInstanceId: string) {}
}

@CommandHandler(CancelWorkflowCommand)
export class CancelWorkflowHandler implements ICommandHandler<CancelWorkflowCommand> {
  async execute(cmd: CancelWorkflowCommand): Promise<Result<void>> {
    // 1. Find WorkflowInstance
    // 2. If COMPLETED → return Result.conflict('Workflow already completed')
    // 3. Call kogitoClient.abortProcess
    // 4. Update status to ABORTED
    // 5. Return Result.success(undefined)
  }
}
```

#### Domain Events

Published via `RedisStreamPublisher` (from kernel):
- `workflow.started`
- `workflow.progressed`
- `workflow.completed`
- `workflow.failed`
- `workflow.aborted`

---

### Usage in Consuming App

```typescript
import { QuanticModule } from '@turkelk/quanticjs';
import { WorkflowModule } from '@turkelk/nestjs-cqrs-workflow';

@Module({
  imports: [
    QuanticModule.forRoot({ redis: { url: process.env.REDIS_URL } }),
    WorkflowModule.forRoot({
      url: process.env.KOGITO_URL,
      fallback: 'throw',
    }),
  ],
})
export class AppModule {}

// Command definition
import { Workflow } from '@turkelk/quanticjs';

@Workflow('user-onboarding')
@Validate(OnboardUserValidator)
export class OnboardUserCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly plan: string,
  ) {}
}

// Handler (only executes on Kogito callback, NOT on initial dispatch)
@CommandHandler(OnboardUserCommand)
export class OnboardUserHandler implements ICommandHandler<OnboardUserCommand> {
  async execute(cmd: OnboardUserCommand): Promise<Result<UserDto>> {
    // This runs when Kogito workflow reaches this service task
    // cmd contains the original payload + any enrichment from process variables
  }
}
```

## Edge Cases

| Edge Case | Handling |
|---|---|
| Kogito unavailable on command dispatch | Apply configured fallback: `throw` → `Result.failure(InternalError)`, `skip` → call `next()`, `queue` → store for retry |
| Kogito returns error starting process | Return `Result.failure(InternalError, ...)`, do not persist WorkflowInstance |
| Callback for unknown processInstanceId | HTTP 404, log warning with payload |
| Callback but commandType not found in app | HTTP 422, log error — misconfigured |
| Duplicate callback (Kogito retries) | Idempotent: if COMPLETED/ABORTED, return HTTP 200 no-op |
| Handler fails on callback re-dispatch | Update WorkflowInstance to FAILED, return HTTP 500 so Kogito retries |
| CancelWorkflow for completed workflow | `Result.failure(Conflict, 'Workflow already completed')` |
| CancelWorkflow but Kogito unreachable | Mark ABORTED locally, log warning (best effort) |
| Multiple intermediate callbacks | Each updates to IN_PROGRESS; handler runs each time (service task pattern) |
| Non-serializable command payload | Runtime check: JSON.stringify the command, throw clear error if it fails |
| No WorkflowEngine provided (kernel only, no companion) | WorkflowBehavior skips all decorated commands silently |
| Companion package imported but kernel too old (no context support) | Peer dependency version constraint prevents this |

## Test Plan

### Kernel Unit Tests

- **WorkflowBehavior**
  - Passes through commands without `@Workflow` decorator
  - Short-circuits decorated commands when WorkflowEngine is present
  - Passes through when context has `workflow-phase: 'execute'`
  - Passes through when no WorkflowEngine is injected
  - Applies fallback 'throw' on engine error
  - Applies fallback 'skip' on engine error (calls next)

- **@Workflow decorator**
  - Stores processDefinitionId in metadata
  - Stores optional fallback in metadata
  - `getWorkflowMetadata` returns undefined for undecorated commands

- **PipelineExecutor (context support)**
  - Context is passed through all behaviors in chain
  - Context is undefined by default (backwards compatible)
  - executeCommand with context reaches the handler

### Companion Package Unit Tests

- **KogitoClient**
  - startProcess → POST `/processes/{id}/instances` with correct body
  - abortProcess → DELETE `/processes/{processId}/instances/{instanceId}`
  - signalProcess → POST correct signal endpoint
  - Timeout handling
  - Non-2xx response handling

- **KogitoWorkflowEngine**
  - startProcess persists WorkflowInstance and calls KogitoClient
  - Returns WorkflowStartResult with correct IDs
  - abortProcess updates entity and calls KogitoClient

- **WorkflowCallbackController**
  - 404 for unknown processInstanceId
  - 200 no-op for duplicate on completed workflow
  - Re-dispatches with correct context
  - Updates status on success / failure

- **CancelWorkflowHandler**
  - Aborts via client + updates entity
  - Conflict for already-completed

### Integration Tests (Companion Package)

- Full flow: `@Workflow` command → short-circuit → simulated callback → handler executes
- Fallback with simulated Kogito outage
- WorkflowInstance lifecycle: STARTED → IN_PROGRESS → COMPLETED
- CancelWorkflow → ABORTED + Kogito abort called
- Idempotent duplicate callbacks
