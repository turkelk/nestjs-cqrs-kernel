"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptResolutionKey = void 0;
/**
 * PromptResolutionKey encapsulates the 5-level fallback lookup key
 * used to resolve prompt templates.
 */
class PromptResolutionKey {
    promptKey;
    techStack;
    databaseType;
    constructor(promptKey, techStack = null, databaseType = null) {
        this.promptKey = promptKey;
        this.techStack = techStack;
        this.databaseType = databaseType;
    }
    /** Cache key format: prompt:{key}:{ts}:{db} */
    toCacheKey() {
        const ts = this.techStack || '*';
        const db = this.databaseType || '*';
        return `prompt:${this.promptKey}:${ts}:${db}`;
    }
    /** Returns the 5-level fallback keys in priority order */
    toFallbackKeys() {
        const keys = [];
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
exports.PromptResolutionKey = PromptResolutionKey;
