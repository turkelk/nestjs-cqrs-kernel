export declare enum ErrorType {
    NotFound = "NOT_FOUND",
    Forbidden = "FORBIDDEN",
    Conflict = "CONFLICT",
    ValidationError = "VALIDATION_ERROR",
    InternalError = "INTERNAL_ERROR",
    Unauthorized = "UNAUTHORIZED",
    UnprocessableEntity = "UNPROCESSABLE_ENTITY"
}
export declare class Result<T> {
    readonly isSuccess: boolean;
    readonly value?: T | undefined;
    readonly errorType?: ErrorType | undefined;
    readonly errorMessage?: string | undefined;
    private constructor();
    static success<T>(value: T): Result<T>;
    static failure<T>(errorType: ErrorType, message: string): Result<T>;
    static notFound<T>(message: string): Result<T>;
    static forbidden<T>(message: string): Result<T>;
    static conflict<T>(message: string): Result<T>;
    static validationError<T>(message: string): Result<T>;
    static unauthorized<T>(message: string): Result<T>;
    static unprocessableEntity<T>(message: string): Result<T>;
    unwrap(): T;
    map<U>(fn: (value: T) => U): Result<U>;
}
//# sourceMappingURL=Result.d.ts.map