import 'reflect-metadata';
export interface FeatureFlagOptions {
    fallback?: 'throw' | 'skip' | 'default';
    defaultValue?: unknown;
}
export declare function FeatureFlag(flagName: string, options?: FeatureFlagOptions): ClassDecorator;
export declare function getFeatureFlagMetadata(target: object): {
    flagName: string;
} & FeatureFlagOptions | undefined;
//# sourceMappingURL=FeatureFlag.decorator.d.ts.map