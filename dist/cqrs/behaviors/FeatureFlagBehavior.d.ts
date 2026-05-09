import { Unleash } from 'unleash-client';
import { Result } from '../../result/Result';
export declare class FeatureFlagBehavior {
    private readonly unleash;
    private readonly logger;
    constructor(unleash: Unleash);
    execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>>;
}
//# sourceMappingURL=FeatureFlagBehavior.d.ts.map