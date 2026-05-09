export declare enum TestPromptType {
    SystemPrompt = "SystemPrompt",
    UserPromptTemplate = "UserPromptTemplate",
    Section = "Section"
}
export interface TestPromptTemplate {
    id: string;
    promptKey: string;
    techStack: string | null;
    databaseType: string | null;
    promptType: string;
    sectionName: string | null;
    content: string;
    version: number;
    isActive: boolean;
    updatedBy: string | null;
    changeNote: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface TestPromptAuditEntry {
    id: string;
    promptTemplateId: string;
    version: number;
    previousContent: string;
    newContent: string;
    changedBy: string;
    changedByEmail: string;
    changedAt: Date;
    changeNote: string | null;
}
/**
 * Test data builder for PromptTemplate entities.
 */
export declare class PromptTemplateBuilder {
    private props;
    private constructor();
    static create(): PromptTemplateBuilder;
    withId(id: string): this;
    withPromptKey(key: string): this;
    withTechStack(ts: string | null): this;
    withDatabaseType(db: string | null): this;
    withPromptType(type: TestPromptType): this;
    withSectionName(name: string): this;
    withContent(content: string): this;
    withVersion(version: number): this;
    asInactive(): this;
    /** Create a universal default (null techStack, null databaseType). */
    asUniversal(): this;
    /** Create a section-type prompt. */
    asSection(sectionName: string): this;
    /** Create a stage system prompt. */
    forStage(stageKey: string): this;
    build(): TestPromptTemplate;
    /** Build multiple variants for the same promptKey across tech stacks. */
    static buildVariants(promptKey: string, stacks: Array<{
        techStack: string | null;
        databaseType: string | null;
        content: string;
    }>): TestPromptTemplate[];
}
//# sourceMappingURL=PromptTemplateBuilder.d.ts.map