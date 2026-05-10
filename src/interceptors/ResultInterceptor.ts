import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, map, catchError } from 'rxjs';
import { Result, ErrorType } from '../result/Result';

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResultInterceptor.name);

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof Result && !data.isSuccess) {
          throw data;
        }
        return data;
      }),
      catchError((error) => {
        if (error instanceof Result) {
          throw error;
        }
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error({
          msg: 'Unhandled exception before CQRS pipeline',
          error: err.message,
          stack: err.stack,
        });
        throw Result.failure(ErrorType.InternalError, err.message);
      }),
    );
  }
}
