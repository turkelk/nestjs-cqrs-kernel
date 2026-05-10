/** Mirrors build-service BuildStatus enum without importing it (avoids cross-workspace dep). */
export declare enum TestBuildStatus {
    Queued = "Queued",
    Running = "Running",
    Completed = "Completed",
    Failed = "Failed",
    Cancelled = "Cancelled"
}
/** Default pipeline stage keys — matches seed data in prompt-service pipeline_stages table. */
export declare const DEFAULT_STAGE_KEYS: string[];
export declare enum TestStageStatus {
    Pending = "Pending",
    Running = "Running",
    Completed = "Completed",
    Failed = "Failed",
    Skipped = "Skipped"
}
export declare enum TestTechStack {
    NestJs = "NestJs",
    DotNet = "DotNet"
}
export declare enum TestDatabaseType {
    MongoDB = "MongoDB",
    PostgreSql = "PostgreSql",
    SqlServer = "SqlServer",
    MySql = "MySql"
}
export declare enum TestCostMode {
    Economy = "Economy",
    Balanced = "Balanced",
    Premium = "Premium"
}
/** @deprecated Use DEFAULT_STAGE_KEYS instead. Alias kept for backward compat in existing tests. */
export declare const TestStageType: Record<string, string>;
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
export declare class BuildBuilder {
    private props;
    private stageKeys;
    private constructor();
    static create(): BuildBuilder;
    withId(id: string): this;
    withOrganizationId(orgId: string): this;
    withUserId(userId: string): this;
    withStatus(status: TestBuildStatus): this;
    withTechStack(ts: TestTechStack): this;
    withDatabaseType(db: TestDatabaseType): this;
    withCostMode(mode: TestCostMode): this;
    withBrdText(text: string): this;
    withCurrentStage(stage: number): this;
    withErrorMessage(msg: string): this;
    withRepoUrl(url: string): this;
    /** Override the default pipeline stage keys (for testing dynamic pipelines). */
    withStageKeys(keys: string[]): this;
    /** Mark first N stages as Completed, rest as Pending. */
    withCompletedStages(count: number): this;
    /** Build a completed build with all stages done. */
    asCompleted(): this;
    /** Build a failed build at a specific stage. */
    asFailed(atStage?: number): this;
    /** Build a cancelled build. */
    asCancelled(): this;
    build(): TestBuild;
}
