"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["NotFound"] = "NOT_FOUND";
    ErrorType["Forbidden"] = "FORBIDDEN";
    ErrorType["Conflict"] = "CONFLICT";
    ErrorType["ValidationError"] = "VALIDATION_ERROR";
    ErrorType["InternalError"] = "INTERNAL_ERROR";
    ErrorType["Unauthorized"] = "UNAUTHORIZED";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
class Result {
    isSuccess;
    value;
    errorType;
    errorMessage;
    constructor(isSuccess, value, errorType, errorMessage) {
        this.isSuccess = isSuccess;
        this.value = value;
        this.errorType = errorType;
        this.errorMessage = errorMessage;
    }
    static success(value) {
        return new Result(true, value);
    }
    static failure(errorType, message) {
        return new Result(false, undefined, errorType, message);
    }
    static notFound(message) {
        return Result.failure(ErrorType.NotFound, message);
    }
    static forbidden(message) {
        return Result.failure(ErrorType.Forbidden, message);
    }
    static conflict(message) {
        return Result.failure(ErrorType.Conflict, message);
    }
    static validationError(message) {
        return Result.failure(ErrorType.ValidationError, message);
    }
    static unauthorized(message) {
        return Result.failure(ErrorType.Unauthorized, message);
    }
    unwrap() {
        if (!this.isSuccess || this.value === undefined) {
            throw new Error(`Cannot unwrap failed Result: ${this.errorType} - ${this.errorMessage}`);
        }
        return this.value;
    }
    map(fn) {
        if (this.isSuccess && this.value !== undefined) {
            return Result.success(fn(this.value));
        }
        return Result.failure(this.errorType, this.errorMessage);
    }
}
exports.Result = Result;
//# sourceMappingURL=Result.js.map