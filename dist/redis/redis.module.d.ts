import { DynamicModule } from '@nestjs/common';
export interface RedisModuleOptions {
    url?: string;
}
export declare class RedisModule {
    private static readonly logger;
    static forRoot(options?: RedisModuleOptions): DynamicModule;
}
//# sourceMappingURL=redis.module.d.ts.map