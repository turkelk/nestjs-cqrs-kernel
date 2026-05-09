import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { Result, ErrorType } from '../result/Result';
import { correlationStore } from '../middleware/CorrelationStore';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  correlationId?: string;
  retryAfter?: number;
  errors?: Array<{ field?: string; message: string }>;
  stack?: string;
}

const ERROR_TYPE_TO_STATUS: Record<string, number> = {
  [ErrorType.NotFound]: 404,
  [ErrorType.Forbidden]: 403,
  [ErrorType.Unauthorized]: 401,
  [ErrorType.Conflict]: 409,
  [ErrorType.ValidationError]: 400,
  [ErrorType.InternalError]: 500,
};

/**
 * Global exception filter that maps domain Result error types
 * and Node exceptions to RFC 7807 ProblemDetails-style JSON responses.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const correlationId = correlationStore.getStore()?.correlationId;

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

  private toProblemDetails(
    exception: unknown,
    correlationId?: string,
  ): ProblemDetails {
    // Handle Result objects passed as exceptions
    if (exception instanceof Object && 'isSuccess' in exception) {
      const result = exception as Result<unknown>;
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
    if (exception instanceof ThrottlerException) {
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
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const detail =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;

      // NestJS ValidationPipe errors (DTO-level)
      if (status === 400 && Array.isArray(detail)) {
        return {
          type: 'https://arex.dev/errors/VALIDATION_ERROR',
          title: 'Validation Error',
          status: 400,
          detail: 'One or more validation errors occurred.',
          correlationId,
          errors: (detail as string[]).map((msg) => ({ message: msg })),
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
}
