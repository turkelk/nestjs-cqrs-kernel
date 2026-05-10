import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, switchMap, catchError, of, EMPTY } from 'rxjs';
import { Result, ErrorType } from '../result/Result';
import { correlationStore } from '../middleware/CorrelationStore';

const ERROR_TYPE_TO_STATUS: Record<string, number> = {
  [ErrorType.NotFound]: 404,
  [ErrorType.Forbidden]: 403,
  [ErrorType.Unauthorized]: 401,
  [ErrorType.Conflict]: 409,
  [ErrorType.ValidationError]: 400,
  [ErrorType.UnprocessableEntity]: 422,
  [ErrorType.InternalError]: 500,
};

const ERROR_TYPE_TO_TITLE: Record<string, string> = {
  [ErrorType.NotFound]: 'Not Found',
  [ErrorType.Forbidden]: 'Forbidden',
  [ErrorType.Unauthorized]: 'Unauthorized',
  [ErrorType.Conflict]: 'Conflict',
  [ErrorType.ValidationError]: 'Validation Error',
  [ErrorType.UnprocessableEntity]: 'Unprocessable Entity',
  [ErrorType.InternalError]: 'Internal Server Error',
};

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResultInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      switchMap((data) => {
        if (data instanceof Result && !data.isSuccess) {
          this.sendResultError(context, data);
          return EMPTY;
        }
        return of(data);
      }),
      catchError((error) => {
        if (error instanceof Result) {
          this.sendResultError(context, error);
          return EMPTY;
        }
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error({
          msg: 'Unhandled exception before CQRS pipeline',
          error: err.message,
          stack: err.stack,
        });
        this.sendResultError(context, Result.failure(ErrorType.InternalError, err.message));
        return EMPTY;
      }),
    );
  }

  private sendResultError(context: ExecutionContext, result: Result<unknown>): void {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId = correlationStore.getStore()?.correlationId;
    const status = ERROR_TYPE_TO_STATUS[result.errorType!] ?? 500;
    const title = ERROR_TYPE_TO_TITLE[result.errorType!] ?? 'Unknown Error';

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
}
