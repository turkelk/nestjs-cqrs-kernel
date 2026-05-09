"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validate = Validate;
exports.shouldValidate = shouldValidate;
exports.getValidatorClass = getValidatorClass;
require("reflect-metadata");
const VALIDATE_KEY = 'arex:validate';
const VALIDATOR_CLASS_KEY = 'arex:validator-class';
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
function Validate(validatorClass) {
    return (target) => {
        Reflect.defineMetadata(VALIDATE_KEY, true, target);
        Reflect.defineMetadata(VALIDATOR_CLASS_KEY, validatorClass, target);
    };
}
function shouldValidate(target) {
    return Reflect.getMetadata(VALIDATE_KEY, target) === true;
}
function getValidatorClass(target) {
    return Reflect.getMetadata(VALIDATOR_CLASS_KEY, target);
}
//# sourceMappingURL=Validate.decorator.js.map