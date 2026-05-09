"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildBuilder = exports.TestStageType = exports.TestCostMode = exports.TestDatabaseType = exports.TestTechStack = exports.TestStageStatus = exports.DEFAULT_STAGE_KEYS = exports.TestBuildStatus = void 0;
const uuid_1 = require("uuid");
/** Mirrors build-service BuildStatus enum without importing it (avoids cross-workspace dep). */
var TestBuildStatus;
(function (TestBuildStatus) {
    TestBuildStatus["Queued"] = "Queued";
    TestBuildStatus["Running"] = "Running";
    TestBuildStatus["Completed"] = "Completed";
    TestBuildStatus["Failed"] = "Failed";
    TestBuildStatus["Cancelled"] = "Cancelled";
})(TestBuildStatus || (exports.TestBuildStatus = TestBuildStatus = {}));
/** Default pipeline stage keys — matches seed data in prompt-service pipeline_stages table. */
exports.DEFAULT_STAGE_KEYS = [
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
var TestStageStatus;
(function (TestStageStatus) {
    TestStageStatus["Pending"] = "Pending";
    TestStageStatus["Running"] = "Running";
    TestStageStatus["Completed"] = "Completed";
    TestStageStatus["Failed"] = "Failed";
    TestStageStatus["Skipped"] = "Skipped";
})(TestStageStatus || (exports.TestStageStatus = TestStageStatus = {}));
var TestTechStack;
(function (TestTechStack) {
    TestTechStack["NestJs"] = "NestJs";
    TestTechStack["DotNet"] = "DotNet";
})(TestTechStack || (exports.TestTechStack = TestTechStack = {}));
var TestDatabaseType;
(function (TestDatabaseType) {
    TestDatabaseType["MongoDB"] = "MongoDB";
    TestDatabaseType["PostgreSql"] = "PostgreSql";
    TestDatabaseType["SqlServer"] = "SqlServer";
    TestDatabaseType["MySql"] = "MySql";
})(TestDatabaseType || (exports.TestDatabaseType = TestDatabaseType = {}));
var TestCostMode;
(function (TestCostMode) {
    TestCostMode["Economy"] = "Economy";
    TestCostMode["Balanced"] = "Balanced";
    TestCostMode["Premium"] = "Premium";
})(TestCostMode || (exports.TestCostMode = TestCostMode = {}));
/** @deprecated Use DEFAULT_STAGE_KEYS instead. Alias kept for backward compat in existing tests. */
exports.TestStageType = Object.fromEntries(exports.DEFAULT_STAGE_KEYS.map((k) => [k, k]));
/**
 * Test data builder for Build + 11 BuildStage entities.
 * Uses the Builder pattern — call methods to override defaults, then `.build()`.
 */
class BuildBuilder {
    props = {};
    stageKeys = exports.DEFAULT_STAGE_KEYS;
    constructor() { }
    static create() {
        return new BuildBuilder();
    }
    withId(id) { this.props.id = id; return this; }
    withOrganizationId(orgId) { this.props.organizationId = orgId; return this; }
    withUserId(userId) { this.props.userId = userId; return this; }
    withStatus(status) { this.props.status = status; return this; }
    withTechStack(ts) { this.props.techStack = ts; return this; }
    withDatabaseType(db) { this.props.databaseType = db; return this; }
    withCostMode(mode) { this.props.costMode = mode; return this; }
    withBrdText(text) { this.props.brdText = text; return this; }
    withCurrentStage(stage) { this.props.currentStage = stage; return this; }
    withErrorMessage(msg) { this.props.errorMessage = msg; return this; }
    withRepoUrl(url) { this.props.repoUrl = url; return this; }
    /** Override the default pipeline stage keys (for testing dynamic pipelines). */
    withStageKeys(keys) { this.stageKeys = keys; return this; }
    /** Mark first N stages as Completed, rest as Pending. */
    withCompletedStages(count) {
        this.props.currentStage = count;
        return this;
    }
    /** Build a completed build with all stages done. */
    asCompleted() {
        this.props.status = TestBuildStatus.Completed;
        this.props.currentStage = this.stageKeys.length;
        this.props.completedAt = new Date();
        return this;
    }
    /** Build a failed build at a specific stage. */
    asFailed(atStage = 3) {
        this.props.status = TestBuildStatus.Failed;
        this.props.currentStage = atStage;
        this.props.errorMessage = 'AI provider timeout';
        return this;
    }
    /** Build a cancelled build. */
    asCancelled() {
        this.props.status = TestBuildStatus.Cancelled;
        return this;
    }
    build() {
        const now = new Date();
        const buildId = this.props.id ?? (0, uuid_1.v4)();
        const status = this.props.status ?? TestBuildStatus.Queued;
        const currentStage = this.props.currentStage ?? 0;
        const build = {
            id: buildId,
            organizationId: this.props.organizationId ?? (0, uuid_1.v4)(),
            userId: this.props.userId ?? (0, uuid_1.v4)(),
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
            let stageStatus;
            if (status === TestBuildStatus.Cancelled && index >= currentStage) {
                stageStatus = TestStageStatus.Skipped;
            }
            else if (status === TestBuildStatus.Failed && index === currentStage) {
                stageStatus = TestStageStatus.Failed;
            }
            else if (index < currentStage) {
                stageStatus = TestStageStatus.Completed;
            }
            else if (index === currentStage && status === TestBuildStatus.Running) {
                stageStatus = TestStageStatus.Running;
            }
            else {
                stageStatus = TestStageStatus.Pending;
            }
            return {
                id: (0, uuid_1.v4)(),
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
exports.BuildBuilder = BuildBuilder;
//# sourceMappingURL=BuildBuilder.js.map