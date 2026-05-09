import { Injectable } from '@nestjs/common';
import { shouldValidate, getValidatorClass } from '../decorators/Validate.decorator';
import { Result, ErrorType } from '../../result/Result';

@Injectable()
export class ValidationBehavior {
  async execute<T>(command: object, next: () => Promise<Result<T>>): Promise<Result<T>> {
    if (!shouldValidate(command.constructor)) {
      return next();
    }

    const ValidatorClass = getValidatorClass(command.constructor);
    if (!ValidatorClass) {
      return next();
    }

    const validator = new ValidatorClass();
    const validationResult = validator.validate(command);

    if (!validationResult.isSuccess) {
      return Result.failure<T>(
        validationResult.errorType ?? ErrorType.ValidationError,
        validationResult.errorMessage ?? 'Validation failed',
      );
    }

    return next();
  }
}
