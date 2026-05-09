"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const Result_1 = require("../result/Result");
const CorrelationStore_1 = require("../middleware/CorrelationStore");
const ERROR_TYPE_TO_STATUS = {
    [Result_1.ErrorType.NotFound]: 404,
    [Result_1.ErrorType.Forbidden]: 403,
    [Result_1.ErrorType.Unauthorized]: 401,
    [Result_1.ErrorType.Conflict]: 409,
    [Result_1.ErrorType.ValidationError]: 400,
    [Result_1.ErrorType.InternalError]: 500,
};
/**
 * Global exception filter that maps domain Result error types
 * and Node exceptions to RFC 7807 ProblemDetails-style JSON responses.
 */
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    isProduction = process.env.NODE_ENV === 'production';
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const correlationId = CorrelationStore_1.correlationStore.getStore()?.correlationId;
        if (correlationId) {
            response.setHeader('X-Correlation-ID', correlationId);
        }
        const problem = this.toProblemDetails(exception, correlationId);
        this.logger.error({
            msg: `${problem.status} ${problem.title}`,
            correlationId,
            status: problem.status,
            detail: problem.detail,
        });
        response.status(problem.status).json(problem);
    }
    toProblemDetails(exception, correlationId) {
        // Handle Result objects passed as exceptions
        if (exception instanceof Object && 'isSuccess' in exception) {
            const result = exception;
            if (!result.isSuccess && result.errorType) {
                const status = ERROR_TYPE_TO_STATUS[result.errorType] ?? 500;
                return {
                    type: `https://arex.dev/errors/${result.errorType}`,
                    title: result.errorType,
                    status,
                    detail: result.errorMessage,
                    correlationId,
                };
            }
        }
        // ThrottlerException → 429
        if (exception instanceof throttler_1.ThrottlerException) {
            return {
                type: 'https://arex.dev/errors/RATE_LIMITED',
                title: 'Too Many Requests',
                status: 429,
                detail: 'Rate limit exceeded. Please retry later.',
                correlationId,
                retryAfter: 60,
            };
        }
        // NestJS HttpException
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const detail = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message;
            // NestJS ValidationPipe errors (DTO-level)
            if (status === 400 && Array.isArray(detail)) {
                return {
                    type: 'https://arex.dev/errors/VALIDATION_ERROR',
                    title: 'Validation Error',
                    status: 400,
                    detail: 'One or more validation errors occurred.',
                    correlationId,
                    errors: detail.map((msg) => ({ message: msg })),
                };
            }
            return {
                type: `https://arex.dev/errors/HTTP_${status}`,
                title: exception.name,
                status,
                detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
                correlationId,
            };
        }
        // Unhandled errors
        const error = exception instanceof Error ? exception : new Error(String(exception));
        return {
            type: 'https://arex.dev/errors/INTERNAL_ERROR',
            title: 'Internal Server Error',
            status: 500,
            detail: this.isProduction ? 'An unexpected error occurred.' : error.message,
            correlationId,
            ...(this.isProduction ? {} : { stack: error.stack }),
        };
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=GlobalExceptionFilter.js.map