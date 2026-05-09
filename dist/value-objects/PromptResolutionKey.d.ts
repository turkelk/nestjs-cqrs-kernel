import type { TechStackType, DatabaseTypeValue } from './StackProfile';
/**
 * PromptResolutionKey encapsulates the 5-level fallback lookup key
 * used to resolve prompt templates.
 */
export declare class PromptResolutionKey {
    readonly promptKey: string;
    readonly techStack: TechStackType | null;
    readonly databaseType: DatabaseTypeValue | null;
    constructor(promptKey: string, techStack?: TechStackType | null, databaseType?: DatabaseTypeValue | null);
    /** Cache key format: prompt:{key}:{ts}:{db} */
    toCacheKey(): string;
    /** Returns the 5-level fallback keys in priority order */
    toFallbackKeys(): PromptResolutionKey[];
}
//# sourceMappingURL=PromptResolutionKey.d.ts.map