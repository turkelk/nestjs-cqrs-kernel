import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { correlationStore } from '../middleware/CorrelationStore';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  retryAfter?: number;
  errors?: Array<{ field?: string; message: string }>;
  stack?: string;
}

/**
 * Global exception filter for framework-level exceptions (guards, pipes, throttler).
 * Result<T> errors are handled by ResultInterceptor — they never reach this filter.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const correlationId = correlationStore.getStore()?.correlationId;

    if (response.headersSent) return;

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

  private toProblemDetails(
    exception: unknown,
    correlationId?: string,
    instance?: string,
  ): ProblemDetails {
    // ThrottlerException → 429
    if (exception instanceof ThrottlerException) {
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
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const detail =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;

      if (status === 400 && Array.isArray(detail)) {
        return {
          type: 'https://arex.dev/errors/VALIDATION_ERROR',
          title: 'Validation Error',
          status: 400,
          detail: 'One or more validation errors occurred.',
          instance,
          correlationId,
          errors: (detail as string[]).map((msg) => ({ message: msg })),
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
}
