"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PipelineExecutor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineExecutor = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const LogBehavior_1 = require("./behaviors/LogBehavior");
const ValidationBehavior_1 = require("./behaviors/ValidationBehavior");
const CacheBehavior_1 = require("./behaviors/CacheBehavior");
const DistributedLockBehavior_1 = require("./behaviors/DistributedLockBehavior");
const TransactionalBehavior_1 = require("./behaviors/TransactionalBehavior");
const PerformanceBehavior_1 = require("./behaviors/PerformanceBehavior");
/**
 * PipelineExecutor wraps CommandBus and QueryBus with separate behavior chains.
 *
 * Command chain (all writes):
 *   Log → Performance → FeatureFlag → Validate → Workflow → Cache → DistributedLock → Transactional → Handler
 *
 * Query chain (reads only):
 *   Log → Performance → FeatureFlag → Validate → Cache → Handler
 *
 * Every command is transactional by default (UnitOfWork pattern).
 * Queries skip Transactional and DistributedLock — they are read-only.
 */
let PipelineExecutor = PipelineExecutor_1 = class PipelineExecutor {
    commandBus;
    queryBus;
    logBehavior;
    featureFlagBehavior;
    validationBehavior;
    cacheBehavior;
    distributedLockBehavior;
    transactionalBehavior;
    performanceBehavior;
    workflowBehavior;
    logger = new common_1.Logger(PipelineExecutor_1.name);
    commandBehaviors = [];
    queryBehaviors = [];
    constructor(commandBus, queryBus, logBehavior, featureFlagBehavior, validationBehavior, cacheBehavior, distributedLockBehavior, transactionalBehavior, performanceBehavior, workflowBehavior) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.logBehavior = logBehavior;
        this.featureFlagBehavior = featureFlagBehavior;
        this.validationBehavior = validationBehavior;
        this.cacheBehavior = cacheBehavior;
        this.distributedLockBehavior = distributedLockBehavior;
        this.transactionalBehavior = transactionalBehavior;
        this.performanceBehavior = performanceBehavior;
        this.workflowBehavior = workflowBehavior;
    }
    onModuleInit() {
        const featureFlagStep = this.featureFlagBehavior
            ? [(cmd, next) => this.featureFlagBehavior.execute(cmd, next)]
            : [];
        const workflowStep = this.workflowBehavior
            ? [(cmd, next, context) => this.workflowBehavior.execute(cmd, next, context)]
            : [];
        this.commandBehaviors = [
            (cmd, next) => this.logBehavior.execute(cmd, next),
            (cmd, next) => this.performanceBehavior.execute(cmd, next),
            ...featureFlagStep,
            (cmd, next) => this.validationBehavior.execute(cmd, next),
            ...workflowStep,
            (cmd, next) => this.cacheBehavior.execute(cmd, next),
            (cmd, next) => this.distributedLockBehavior.execute(cmd, next),
            (cmd, next) => this.transactionalBehavior.execute(cmd, next),
        ];
        this.queryBehaviors = [
            (cmd, next) => this.logBehavior.execute(cmd, next),
            (cmd, next) => this.performanceBehavior.execute(cmd, next),
            ...featureFlagStep,
            (cmd, next) => this.validationBehavior.execute(cmd, next),
            (cmd, next) => this.cacheBehavior.execute(cmd, next),
        ];
        this.logger.log(`Pipeline initialized — commands: ${this.commandBehaviors.length} behaviors, queries: ${this.queryBehaviors.length} behaviors`);
    }
    async executeCommand(command, context) {
        const handler = () => this.commandBus.execute(command);
        return this.runPipeline(command, handler, this.commandBehaviors, context);
    }
    async executeQuery(query) {
        const handler = () => this.queryBus.execute(query);
        return this.runPipeline(query, handler, this.queryBehaviors);
    }
    runPipeline(command, handler, behaviors, context) {
        let next = handler;
        for (let i = behaviors.length - 1; i >= 0; i--) {
            const behavior = behaviors[i];
            const currentNext = next;
            next = () => behavior(command, currentNext, context);
        }
        return next();
    }
};
exports.PipelineExecutor = PipelineExecutor;
exports.PipelineExecutor = PipelineExecutor = PipelineExecutor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Optional)()),
    __param(9, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus,
        LogBehavior_1.LogBehavior, Object, ValidationBehavior_1.ValidationBehavior,
        CacheBehavior_1.CacheBehavior,
        DistributedLockBehavior_1.DistributedLockBehavior,
        TransactionalBehavior_1.TransactionalBehavior,
        PerformanceBehavior_1.PerformanceBehavior, Object])
], PipelineExecutor);
