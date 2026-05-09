"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateBuilder = exports.TestPromptType = void 0;
const uuid_1 = require("uuid");
var TestPromptType;
(function (TestPromptType) {
    TestPromptType["SystemPrompt"] = "SystemPrompt";
    TestPromptType["UserPromptTemplate"] = "UserPromptTemplate";
    TestPromptType["Section"] = "Section";
})(TestPromptType || (exports.TestPromptType = TestPromptType = {}));
/**
 * Test data builder for PromptTemplate entities.
 */
class PromptTemplateBuilder {
    props = {};
    constructor() { }
    static create() {
        return new PromptTemplateBuilder();
    }
    withId(id) { this.props.id = id; return this; }
    withPromptKey(key) { this.props.promptKey = key; return this; }
    withTechStack(ts) { this.props.techStack = ts; return this; }
    withDatabaseType(db) { this.props.databaseType = db; return this; }
    withPromptType(type) { this.props.promptType = type; return this; }
    withSectionName(name) { this.props.sectionName = name; return this; }
    withContent(content) { this.props.content = content; return this; }
    withVersion(version) { this.props.version = version; return this; }
    asInactive() { this.props.isActive = false; return this; }
    /** Create a universal default (null techStack, null databaseType). */
    asUniversal() {
        this.props.techStack = null;
        this.props.databaseType = null;
        return this;
    }
    /** Create a section-type prompt. */
    asSection(sectionName) {
        this.props.promptType = TestPromptType.Section;
        this.props.sectionName = sectionName;
        this.props.promptKey = `section.${sectionName}`;
        return this;
    }
    /** Create a stage system prompt. */
    forStage(stageKey) {
        this.props.promptKey = `stage.${stageKey}`;
        this.props.promptType = TestPromptType.SystemPrompt;
        return this;
    }
    build() {
        const now = new Date();
        return {
            id: this.props.id ?? (0, uuid_1.v4)(),
            promptKey: this.props.promptKey ?? 'stage.ProjectPlanning',
            techStack: this.props.techStack ?? null,
            databaseType: this.props.databaseType ?? null,
            promptType: this.props.promptType ?? TestPromptType.SystemPrompt,
            sectionName: this.props.sectionName ?? null,
            content: this.props.content ?? 'You are a senior architect. Generate a project plan for {{section:TechStackBlock}}.',
            version: this.props.version ?? 1,
            isActive: this.props.isActive ?? true,
            updatedBy: this.props.updatedBy ?? null,
            changeNote: this.props.changeNote ?? null,
            createdAt: now,
            updatedAt: now,
        };
    }
    /** Build multiple variants for the same promptKey across tech stacks. */
    static buildVariants(promptKey, stacks) {
        return stacks.map((variant) => PromptTemplateBuilder.create()
            .withPromptKey(promptKey)
            .withTechStack(variant.techStack)
            .withDatabaseType(variant.databaseType)
            .withContent(variant.content)
            .build());
    }
}
exports.PromptTemplateBuilder = PromptTemplateBuilder;
//# sourceMappingURL=PromptTemplateBuilder.js.map