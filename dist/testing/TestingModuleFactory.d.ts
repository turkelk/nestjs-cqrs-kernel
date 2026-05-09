import { TestingModuleBuilder } from '@nestjs/testing';
import { createMockRepository, createMockRedisClient } from './mocks';
export { createMockRepository, createMockRedisClient };
export interface TestingModuleOptions {
    /** Providers to register (handlers, services, etc.) */
    providers?: any[];
    /** Entity classes to auto-mock their repositories */
    entities?: any[];
    /** Additional overrides to apply to the TestingModule builder */
    overrides?: Array<{
        provide: any;
        useValue: any;
    }>;
    /** Whether to include the full CQRS pipeline behaviors (default: false) */
    withPipeline?: boolean;
}
/**
 * Factory for bootstrapping a NestJS TestingModule preconfigured
 * with mocked repositories, Redis, and optionally the CQRS pipeline.
 */
export declare class TestingModuleFactory {
    static create(options?: TestingModuleOptions): TestingModuleBuilder;
}
//# sourceMappingURL=TestingModuleFactory.d.ts.map