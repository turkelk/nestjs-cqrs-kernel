import { OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Redis } from 'ioredis';
/**
 * GracefulShutdownService ensures clean resource teardown on SIGTERM/SIGINT.
 *
 * Shutdown order:
 * 1. Wait for in-flight work (subclasses can override `drainWork`)
 * 2. Close database connections
 * 3. Quit Redis
 */
export declare class GracefulShutdownService implements OnModuleDestroy {
    private readonly dataSource?;
    private readonly redis?;
    private readonly logger;
    constructor(dataSource?: DataSource | undefined, redis?: Redis | undefined);
    onModuleDestroy(): Promise<void>;
    /**
     * Override in service-specific subclasses to drain Bull queues,
     * close Socket.IO servers, etc.
     */
    protected drainWork(): Promise<void>;
    private withTimeout;
}
//# sourceMappingURL=GracefulShutdownService.d.ts.map