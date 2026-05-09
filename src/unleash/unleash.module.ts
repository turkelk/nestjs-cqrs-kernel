import { Module, Global, DynamicModule, Logger } from '@nestjs/common';
import { initialize, Unleash } from 'unleash-client';
import { FeatureFlagBehavior } from '../cqrs/behaviors/FeatureFlagBehavior';

export interface UnleashModuleOptions {
  url?: string;
  appName?: string;
  customHeaders?: Record<string, string>;
}

@Global()
@Module({})
export class UnleashModule {
  static forRoot(options?: UnleashModuleOptions): DynamicModule {
    const unleashProvider = {
      provide: Unleash,
      useFactory: () => {
        const logger = new Logger('UnleashModule');
        const url = options?.url || process.env['UNLEASH_URL'] || 'http://localhost:4242/api';
        const appName = options?.appName || process.env['UNLEASH_APP_NAME'] || 'arex';
        const token =
          options?.customHeaders?.['Authorization'] ||
          process.env['UNLEASH_API_TOKEN'] ||
          '*:*.unleash-insecure-api-token';

        logger.log(`Connecting to Unleash at ${url}`);

        return initialize({
          url,
          appName,
          customHeaders: {
            Authorization: token,
          },
          refreshInterval: 10000,
        });
      },
    };

    return {
      module: UnleashModule,
      providers: [unleashProvider, FeatureFlagBehavior],
      exports: [Unleash, FeatureFlagBehavior],
    };
  }
}
