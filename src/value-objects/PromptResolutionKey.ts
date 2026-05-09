import type { TechStackType, DatabaseTypeValue } from './StackProfile';

/**
 * PromptResolutionKey encapsulates the 5-level fallback lookup key
 * used to resolve prompt templates.
 */
export class PromptResolutionKey {
  constructor(
    public readonly promptKey: string,
    public readonly techStack: TechStackType | null = null,
    public readonly databaseType: DatabaseTypeValue | null = null,
  ) {}

  /** Cache key format: prompt:{key}:{ts}:{db} */
  toCacheKey(): string {
    const ts = this.techStack || '*';
    const db = this.databaseType || '*';
    return `prompt:${this.promptKey}:${ts}:${db}`;
  }

  /** Returns the 5-level fallback keys in priority order */
  toFallbackKeys(): PromptResolutionKey[] {
    const keys: PromptResolutionKey[] = [];

    // Level 1: Exact match (techStack + databaseType)
    if (this.techStack && this.databaseType) {
      keys.push(new PromptResolutionKey(this.promptKey, this.techStack, this.databaseType));
    }

    // Level 2: Tech stack only
    if (this.techStack) {
      keys.push(new PromptResolutionKey(this.promptKey, this.techStack, null));
    }

    // Level 3: Database only
    if (this.databaseType) {
      keys.push(new PromptResolutionKey(this.promptKey, null, this.databaseType));
    }

    // Level 4: Universal default
    keys.push(new PromptResolutionKey(this.promptKey, null, null));

    return keys;
  }
}
