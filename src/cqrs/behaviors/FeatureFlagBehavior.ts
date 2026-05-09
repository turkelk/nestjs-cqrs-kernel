import { Injectable, Logger } from '@nestjs/common';
import { Unleash } from 'unleash-client';
import { getFeatureFlagMetadata } from '../decorators/FeatureFlag.decorator';
import { Result, ErrorType } from '../../result/Result';

@Injectable()
export class FeatureFlagBehavior {
  private readonly logger = new Logger(FeatureFlagBehavior.name);

  constructor(private readonly unleash: Unleash) {}

  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    const metadata = getFeatureFlagMetadata(command.constructor);

    if (!metadata) {
      return next();
    }

    const { flagName, fallback, defaultValue } = metadata;
    const isEnabled = this.unleash.isEnabled(flagName);

    if (isEnabled) {
      return next();
    }

    this.logger.warn(`Feature flag "${flagName}" is disabled, applying fallback: ${fallback}`);

    switch (fallback) {
      case 'skip':
        return Result.success(undefined as unknown as T);
      case 'default':
        return Result.success(defaultValue as T);
      case 'throw':
      default:
        return Result.failure<T>(
          ErrorType.Forbidden,
          `Feature "${flagName}" is currently disabled`,
        );
    }
  }
}
