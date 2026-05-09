import 'reflect-metadata';

const FEATURE_FLAG_KEY = 'arex:feature-flag';

export interface FeatureFlagOptions {
  fallback?: 'throw' | 'skip' | 'default';
  defaultValue?: unknown;
}

export function FeatureFlag(
  flagName: string,
  options: FeatureFlagOptions = { fallback: 'throw' },
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(FEATURE_FLAG_KEY, { flagName, ...options }, target);
  };
}

export function getFeatureFlagMetadata(
  target: object,
): { flagName: string } & FeatureFlagOptions | undefined {
  return Reflect.getMetadata(FEATURE_FLAG_KEY, target);
}
