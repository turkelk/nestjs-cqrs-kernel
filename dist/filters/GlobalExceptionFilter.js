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
const CorrelationStore_1 = require("../middleware/CorrelationStore");
/**
 * Global exception filter for framework-level exceptions (guards, pipes, throttler).
 * Result<T> errors are handled by ResultInterceptor — they never reach this filter.
 */
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    isProduction = process.env.NODE_ENV === 'production';
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const correlationId = CorrelationStore_1.correlationStore.getStore()?.correlationId;
        if (response.headersSent)
            return;
        if (correlationId) {
            response.setHeader('X-Correlation-ID', correlationId);
        }
        const problem = this.toProblemDetails(exception, correlationId, request.originalUrl);
        if (problem.retryAfter) {
            response.setHeader('Retry-After', String(problem.retryAfter));
        }
        this.logger.error({
            msg: `${problem.status} ${problem.title}`,
            correlationId,
            status: problem.status,
            detail: problem.detail,
        });
        response
            .status(problem.status)
            .setHeader('Content-Type', 'application/problem+json')
            .json(problem);
    }
    toProblemDetails(exception, correlationId, instance) {
        // ThrottlerException → 429
        if (exception instanceof throttler_1.ThrottlerException) {
            return {
                type: 'https://arex.dev/errors/RATE_LIMITED',
                title: 'Too Many Requests',
                status: 429,
                detail: 'Rate limit exceeded. Please retry later.',
                instance,
                correlationId,
                retryAfter: 60,
            };
        }
        // NestJS HttpException (guards, pipes, etc.)
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const detail = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : exceptionResponse.message;
            if (status === 400 && Array.isArray(detail)) {
                return {
                    type: 'https://arex.dev/errors/VALIDATION_ERROR',
                    title: 'Validation Error',
                    status: 400,
                    detail: 'One or more validation errors occurred.',
                    instance,
                    correlationId,
                    errors: detail.map((msg) => ({ message: msg })),
                };
            }
            return {
                type: `https://arex.dev/errors/HTTP_${status}`,
                title: exception.name,
                status,
                detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
                instance,
                correlationId,
            };
        }
        // Unhandled errors (middleware crashes, etc.)
        const error = exception instanceof Error ? exception : new Error(String(exception));
        return {
            type: 'https://arex.dev/errors/INTERNAL_ERROR',
            title: 'Internal Server Error',
            status: 500,
            detail: this.isProduction ? 'An unexpected error occurred.' : error.message,
            instance,
            correlationId,
            ...(this.isProduction ? {} : { stack: error.stack }),
        };
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
