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
var WorkflowBehavior_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowBehavior = void 0;
const common_1 = require("@nestjs/common");
const Workflow_decorator_1 = require("../decorators/Workflow.decorator");
const WorkflowEngine_1 = require("../interfaces/WorkflowEngine");
const Result_1 = require("../../result/Result");
let WorkflowBehavior = WorkflowBehavior_1 = class WorkflowBehavior {
    engine;
    logger = new common_1.Logger(WorkflowBehavior_1.name);
    constructor(engine) {
        this.engine = engine;
    }
    async execute(command, next, context) {
        const metadata = (0, Workflow_decorator_1.getWorkflowMetadata)(command.constructor);
        if (!metadata) {
            return next();
        }
        if (!this.engine) {
            this.logger.debug('No WorkflowEngine provided, skipping workflow behavior');
            return next();
        }
        if (context?.get('workflow-phase') === 'execute') {
            return next();
        }
        try {
            const result = await this.engine.startProcess(metadata.processDefinitionId, command, { commandType: command.constructor.name });
            return Result_1.Result.success(result);
        }
        catch (error) {
            const fallback = metadata.fallback ?? 'throw';
            this.logger.warn(`Workflow start failed for "${metadata.processDefinitionId}", applying fallback: ${fallback}`, error.message);
            switch (fallback) {
                case 'skip':
                    return next();
                case 'queue':
                    return Result_1.Result.failure(Result_1.ErrorType.InternalError, `Workflow queuing not available without companion package: ${error.message}`);
                case 'throw':
                default:
                    return Result_1.Result.failure(Result_1.ErrorType.InternalError, `Workflow start failed: ${error.message}`);
            }
        }
    }
};
exports.WorkflowBehavior = WorkflowBehavior;
exports.WorkflowBehavior = WorkflowBehavior = WorkflowBehavior_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(WorkflowEngine_1.WORKFLOW_ENGINE)),
    __metadata("design:paramtypes", [Object])
], WorkflowBehavior);
