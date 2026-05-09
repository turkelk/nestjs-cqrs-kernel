import 'reflect-metadata';
import type { ICommandValidator } from '../validation/ICommandValidator';

const VALIDATE_KEY = 'arex:validate';
const VALIDATOR_CLASS_KEY = 'arex:validator-class';

type ValidatorClass = new () => ICommandValidator;

/**
 * @Validate(ValidatorClass) — links a command/query to its Zod-based validator.
 *
 * The ValidationBehavior instantiates the validator and calls validate()
 * before the handler runs. Returns Result.validationError() on failure.
 *
 * Usage:
 * ```typescript
 * @Validate(BlockUserValidator)
 * export class BlockUserCommand {
 *   constructor(
 *     public readonly blockerId: string,
 *     public readonly blockedUserId: string,
 *   ) {}
 * }
 * ```
 */
export function Validate(validatorClass: ValidatorClass): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(VALIDATE_KEY, true, target);
    Reflect.defineMetadata(VALIDATOR_CLASS_KEY, validatorClass, target);
  };
}

export function shouldValidate(target: object): boolean {
  return Reflect.getMetadata(VALIDATE_KEY, target) === true;
}

export function getValidatorClass(target: object): ValidatorClass | undefined {
  return Reflect.getMetadata(VALIDATOR_CLASS_KEY, target);
}
