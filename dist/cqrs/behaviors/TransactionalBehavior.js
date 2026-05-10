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
var TransactionalBehavior_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionalBehavior = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const Result_1 = require("../../result/Result");
const TransactionContext_1 = require("../transaction/TransactionContext");
const IsolatedTransaction_decorator_1 = require("../decorators/IsolatedTransaction.decorator");
/**
 * TransactionalBehavior — UnitOfWork pattern via AsyncLocalStorage.
 *
 * Every command is transactional by default (no decorator needed):
 * - If no ambient transaction exists → CREATE one, own commit/rollback
 * - If an ambient transaction exists → JOIN it (pass through, outer scope owns lifecycle)
 * - If command is @IsolatedTransaction() → always CREATE a new one, even if context exists
 *
 * Queries skip this behavior entirely (separate pipeline chain in PipelineExecutor).
 */
let TransactionalBehavior = TransactionalBehavior_1 = class TransactionalBehavior {
    dataSource;
    logger = new common_1.Logger(TransactionalBehavior_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async execute(command, next) {
        if (!this.dataSource) {
            return next();
        }
        const existing = TransactionContext_1.TransactionContext.get();
        const isolated = (0, IsolatedTransaction_decorator_1.isIsolatedTransaction)(command.constructor);
        // JOIN — ambient transaction exists and command does not demand isolation
        if (existing && !isolated) {
            return next();
        }
        // CREATE — we are the outermost scope (or isolated); we own the lifecycle
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const result = await TransactionContext_1.TransactionContext.run(queryRunner, () => next());
            if (result.isSuccess) {
                await queryRunner.commitTransaction();
            }
            else {
                await queryRunner.rollbackTransaction();
                this.logger.warn(`Transaction rolled back for ${command.constructor.name}: ${result.errorMessage}`);
            }
            return result;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            return Result_1.Result.failure(Result_1.ErrorType.InternalError, `Transaction failed for ${command.constructor.name}: ${error.message}`);
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.TransactionalBehavior = TransactionalBehavior;
exports.TransactionalBehavior = TransactionalBehavior = TransactionalBehavior_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], TransactionalBehavior);
