import 'reflect-metadata';
import type { ICommandValidator } from '../validation/ICommandValidator';
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
export declare function Validate(validatorClass: ValidatorClass): ClassDecorator;
export declare function shouldValidate(target: object): boolean;
export declare function getValidatorClass(target: object): ValidatorClass | undefined;
export {};
//# sourceMappingURL=Validate.decorator.d.ts.map