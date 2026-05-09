import { v4 as uuid } from 'uuid';

/** Mirrors build-service BuildStatus enum without importing it (avoids cross-workspace dep). */
export enum TestBuildStatus {
  Queued = 'Queued',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

/** Default pipeline stage keys — matches seed data in prompt-service pipeline_stages table. */
export const DEFAULT_STAGE_KEYS: string[] = [
  'BrdParsing',
  'UserStories',
  'UxResearch',
  'SecurityAssessment',
  'DomainModeling',
  'ServiceArchitecture',
  'ApiDesign',
  'FrontendArchitecture',
  'ProjectPlanning',
  'ImplementationSpecs',
  'FrontendSpecs',
  'BacklogBackend',
  'BacklogFrontend',
  'BacklogInfra',
  'Scaffolding',
  'Verification',
];

export enum TestStageStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
  Skipped = 'Skipped',
}

export enum TestTechStack {
  NestJs = 'NestJs',
  DotNet = 'DotNet',
}

export enum TestDatabaseType {
  MongoDB = 'MongoDB',
  PostgreSql = 'PostgreSql',
  SqlServer = 'SqlServer',
  MySql = 'MySql',
}

export enum TestCostMode {
  Economy = 'Economy',
  Balanced = 'Balanced',
  Premium = 'Premium',
}

/** @deprecated Use DEFAULT_STAGE_KEYS instead. Alias kept for backward compat in existing tests. */
export const TestStageType = Object.fromEntries(
  DEFAULT_STAGE_KEYS.map((k) => [k, k]),
) as Record<string, string>;

export interface TestBuild {
  id: string;
  organizationId: string;
  userId: string;
  status: string;
  techStack: string;
  databaseType: string;
  costMode: string;
  brdText: string;
  brdFileKey: string | null;
  currentStage: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  repoOwner: string | null;
  repoName: string | null;
  repoUrl: string | null;
  wavesGenerated: number;
  docsGenerated: number;
  promptVersions: Record<string, number> | null;
  qualityRating: number | null;
  errorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stages: TestBuildStage[];
}

export interface TestBuildStage {
  id: string;
  buildId: string;
  stageType: string;
  stageIndex: number;
  status: string;
  resultJson: string | null;
  s3CheckpointKey: string | null;
  modelUsed: string | null;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Test data builder for Build + 11 BuildStage entities.
 * Uses the Builder pattern — call methods to override defaults, then `.build()`.
 */
export class BuildBuilder {
  private props: Partial<TestBuild> = {};
  private stageKeys: string[] = DEFAULT_STAGE_KEYS;

  private constructor() {}

  static create(): BuildBuilder {
    return new BuildBuilder();
  }

  withId(id: string): this { this.props.id = id; return this; }
  withOrganizationId(orgId: string): this { this.props.organizationId = orgId; return this; }
  withUserId(userId: string): this { this.props.userId = userId; return this; }
  withStatus(status: TestBuildStatus): this { this.props.status = status; return this; }
  withTechStack(ts: TestTechStack): this { this.props.techStack = ts; return this; }
  withDatabaseType(db: TestDatabaseType): this { this.props.databaseType = db; return this; }
  withCostMode(mode: TestCostMode): this { this.props.costMode = mode; return this; }
  withBrdText(text: string): this { this.props.brdText = text; return this; }
  withCurrentStage(stage: number): this { this.props.currentStage = stage; return this; }
  withErrorMessage(msg: string): this { this.props.errorMessage = msg; return this; }
  withRepoUrl(url: string): this { this.props.repoUrl = url; return this; }
  /** Override the default pipeline stage keys (for testing dynamic pipelines). */
  withStageKeys(keys: string[]): this { this.stageKeys = keys; return this; }

  /** Mark first N stages as Completed, rest as Pending. */
  withCompletedStages(count: number): this {
    this.props.currentStage = count;
    return this;
  }

  /** Build a completed build with all stages done. */
  asCompleted(): this {
    this.props.status = TestBuildStatus.Completed;
    this.props.currentStage = this.stageKeys.length;
    this.props.completedAt = new Date();
    return this;
  }

  /** Build a failed build at a specific stage. */
  asFailed(atStage = 3): this {
    this.props.status = TestBuildStatus.Failed;
    this.props.currentStage = atStage;
    this.props.errorMessage = 'AI provider timeout';
    return this;
  }

  /** Build a cancelled build. */
  asCancelled(): this {
    this.props.status = TestBuildStatus.Cancelled;
    return this;
  }

  build(): TestBuild {
    const now = new Date();
    const buildId = this.props.id ?? uuid();
    const status = this.props.status ?? TestBuildStatus.Queued;
    const currentStage = this.props.currentStage ?? 0;

    const build: TestBuild = {
      id: buildId,
      organizationId: this.props.organizationId ?? uuid(),
      userId: this.props.userId ?? uuid(),
      status,
      techStack: this.props.techStack ?? TestTechStack.NestJs,
      databaseType: this.props.databaseType ?? TestDatabaseType.PostgreSql,
      costMode: this.props.costMode ?? TestCostMode.Balanced,
      brdText: this.props.brdText ?? 'A valid BRD text for testing purposes that meets the minimum length requirement for builds. '.repeat(3),
      brdFileKey: this.props.brdFileKey ?? null,
      currentStage,
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      repoOwner: this.props.repoOwner ?? null,
      repoName: this.props.repoName ?? null,
      repoUrl: this.props.repoUrl ?? null,
      wavesGenerated: 0,
      docsGenerated: 0,
      promptVersions: this.props.promptVersions ?? null,
      qualityRating: this.props.qualityRating ?? null,
      errorMessage: this.props.errorMessage ?? null,
      startedAt: status !== TestBuildStatus.Queued ? now : null,
      completedAt: this.props.completedAt ?? null,
      createdAt: now,
      updatedAt: now,
      stages: [],
    };

    // Generate stages dynamically from stageKeys
    build.stages = this.stageKeys.map((stageType, index) => {
      let stageStatus: string;
      if (status === TestBuildStatus.Cancelled && index >= currentStage) {
        stageStatus = TestStageStatus.Skipped;
      } else if (status === TestBuildStatus.Failed && index === currentStage) {
        stageStatus = TestStageStatus.Failed;
      } else if (index < currentStage) {
        stageStatus = TestStageStatus.Completed;
      } else if (index === currentStage && status === TestBuildStatus.Running) {
        stageStatus = TestStageStatus.Running;
      } else {
        stageStatus = TestStageStatus.Pending;
      }

      return {
        id: uuid(),
        buildId,
        stageType,
        stageIndex: index,
        status: stageStatus,
        resultJson: stageStatus === TestStageStatus.Completed ? '{"output":"stage result"}' : null,
        s3CheckpointKey: stageStatus === TestStageStatus.Completed ? `checkpoints/${buildId}/${index}` : null,
        modelUsed: stageStatus === TestStageStatus.Completed ? 'gpt-4o' : null,
        costUsd: stageStatus === TestStageStatus.Completed ? 0.05 : 0,
        inputTokens: stageStatus === TestStageStatus.Completed ? 1000 : 0,
        outputTokens: stageStatus === TestStageStatus.Completed ? 500 : 0,
        startedAt: stageStatus !== TestStageStatus.Pending ? now : null,
        completedAt: stageStatus === TestStageStatus.Completed ? now : null,
        errorMessage: stageStatus === TestStageStatus.Failed ? 'AI provider timeout' : null,
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      };
    });

    return build;
  }
}
