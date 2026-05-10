import { DynamicModule } from '@nestjs/common';
export interface UnleashModuleOptions {
    url?: string;
    appName?: string;
    customHeaders?: Record<string, string>;
}
export declare class UnleashModule {
    static forRoot(options?: UnleashModuleOptions): DynamicModule;
}
