export enum ErrorType {
  NotFound = 'NOT_FOUND',
  Forbidden = 'FORBIDDEN',
  Conflict = 'CONFLICT',
  ValidationError = 'VALIDATION_ERROR',
  InternalError = 'INTERNAL_ERROR',
  Unauthorized = 'UNAUTHORIZED',
  UnprocessableEntity = 'UNPROCESSABLE_ENTITY',
}

export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value?: T,
    public readonly errorType?: ErrorType,
    public readonly errorMessage?: string,
  ) {}

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static failure<T>(errorType: ErrorType, message: string): Result<T> {
    return new Result<T>(false, undefined, errorType, message);
  }

  static notFound<T>(message: string): Result<T> {
    return Result.failure<T>(ErrorType.NotFound, message);
  }

  static forbidden<T>(message: string): Result<T> {
    return Result.failure<T>(ErrorType.Forbidden, message);
  }

  static conflict<T>(message: string): Result<T> {
    return Result.failure<T>(ErrorType.Conflict, message);
  }

  static validationError<T>(message: string): Result<T> {
    return Result.failure<T>(ErrorType.ValidationError, message);
  }

  static unauthorized<T>(message: string): Result<T> {
    return Result.failure<T>(ErrorType.Unauthorized, message);
  }

  static unprocessableEntity<T>(message: string): Result<T> {
    return Result.failure<T>(ErrorType.UnprocessableEntity, message);
  }

  unwrap(): T {
    if (!this.isSuccess || this.value === undefined) {
      throw new Error(
        `Cannot unwrap failed Result: ${this.errorType} - ${this.errorMessage}`,
      );
    }
    return this.value;
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isSuccess && this.value !== undefined) {
      return Result.success(fn(this.value));
    }
    return Result.failure<U>(this.errorType!, this.errorMessage!);
  }
}
