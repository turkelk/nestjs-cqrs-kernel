import { v4 as uuid } from 'uuid';

export enum TestPromptType {
  SystemPrompt = 'SystemPrompt',
  UserPromptTemplate = 'UserPromptTemplate',
  Section = 'Section',
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
export class PromptTemplateBuilder {
  private props: Partial<TestPromptTemplate> = {};

  private constructor() {}

  static create(): PromptTemplateBuilder {
    return new PromptTemplateBuilder();
  }

  withId(id: string): this { this.props.id = id; return this; }
  withPromptKey(key: string): this { this.props.promptKey = key; return this; }
  withTechStack(ts: string | null): this { this.props.techStack = ts; return this; }
  withDatabaseType(db: string | null): this { this.props.databaseType = db; return this; }
  withPromptType(type: TestPromptType): this { this.props.promptType = type; return this; }
  withSectionName(name: string): this { this.props.sectionName = name; return this; }
  withContent(content: string): this { this.props.content = content; return this; }
  withVersion(version: number): this { this.props.version = version; return this; }
  asInactive(): this { this.props.isActive = false; return this; }

  /** Create a universal default (null techStack, null databaseType). */
  asUniversal(): this {
    this.props.techStack = null;
    this.props.databaseType = null;
    return this;
  }

  /** Create a section-type prompt. */
  asSection(sectionName: string): this {
    this.props.promptType = TestPromptType.Section;
    this.props.sectionName = sectionName;
    this.props.promptKey = `section.${sectionName}`;
    return this;
  }

  /** Create a stage system prompt. */
  forStage(stageKey: string): this {
    this.props.promptKey = `stage.${stageKey}`;
    this.props.promptType = TestPromptType.SystemPrompt;
    return this;
  }

  build(): TestPromptTemplate {
    const now = new Date();
    return {
      id: this.props.id ?? uuid(),
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
  static buildVariants(promptKey: string, stacks: Array<{ techStack: string | null; databaseType: string | null; content: string }>): TestPromptTemplate[] {
    return stacks.map((variant) =>
      PromptTemplateBuilder.create()
        .withPromptKey(promptKey)
        .withTechStack(variant.techStack)
        .withDatabaseType(variant.databaseType)
        .withContent(variant.content)
        .build(),
    );
  }
}
