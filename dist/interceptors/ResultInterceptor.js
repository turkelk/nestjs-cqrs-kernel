"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResultInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const Result_1 = require("../result/Result");
const CorrelationStore_1 = require("../middleware/CorrelationStore");
const ERROR_TYPE_TO_STATUS = {
    [Result_1.ErrorType.NotFound]: 404,
    [Result_1.ErrorType.Forbidden]: 403,
    [Result_1.ErrorType.Unauthorized]: 401,
    [Result_1.ErrorType.Conflict]: 409,
    [Result_1.ErrorType.ValidationError]: 400,
    [Result_1.ErrorType.UnprocessableEntity]: 422,
    [Result_1.ErrorType.InternalError]: 500,
};
const ERROR_TYPE_TO_TITLE = {
    [Result_1.ErrorType.NotFound]: 'Not Found',
    [Result_1.ErrorType.Forbidden]: 'Forbidden',
    [Result_1.ErrorType.Unauthorized]: 'Unauthorized',
    [Result_1.ErrorType.Conflict]: 'Conflict',
    [Result_1.ErrorType.ValidationError]: 'Validation Error',
    [Result_1.ErrorType.UnprocessableEntity]: 'Unprocessable Entity',
    [Result_1.ErrorType.InternalError]: 'Internal Server Error',
};
let ResultInterceptor = ResultInterceptor_1 = class ResultInterceptor {
    logger = new common_1.Logger(ResultInterceptor_1.name);
    intercept(context, next) {
        return next.handle().pipe((0, rxjs_1.switchMap)((data) => {
            if (data instanceof Result_1.Result && !data.isSuccess) {
                this.sendResultError(context, data);
                return rxjs_1.EMPTY;
            }
            return (0, rxjs_1.of)(data);
        }), (0, rxjs_1.catchError)((error) => {
            if (error instanceof Result_1.Result) {
                this.sendResultError(context, error);
                return rxjs_1.EMPTY;
            }
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger.error({
                msg: 'Unhandled exception before CQRS pipeline',
                error: err.message,
                stack: err.stack,
            });
            this.sendResultError(context, Result_1.Result.failure(Result_1.ErrorType.InternalError, err.message));
            return rxjs_1.EMPTY;
        }));
    }
    sendResultError(context, result) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const correlationId = CorrelationStore_1.correlationStore.getStore()?.correlationId;
        const status = ERROR_TYPE_TO_STATUS[result.errorType] ?? 500;
        const title = ERROR_TYPE_TO_TITLE[result.errorType] ?? 'Unknown Error';
        if (correlationId) {
            response.setHeader('X-Correlation-ID', correlationId);
        }
        this.logger.warn({
            msg: `${status} ${result.errorType}`,
            correlationId,
            status,
            detail: result.errorMessage,
        });
        response
            .status(status)
            .setHeader('Content-Type', 'application/problem+json')
            .json({
            type: `https://arex.dev/errors/${result.errorType}`,
            title,
            status,
            detail: result.errorMessage,
            instance: request.originalUrl,
            correlationId,
        });
    }
};
exports.ResultInterceptor = ResultInterceptor;
exports.ResultInterceptor = ResultInterceptor = ResultInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], ResultInterceptor);
