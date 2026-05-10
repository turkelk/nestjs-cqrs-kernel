"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationBehavior = void 0;
const common_1 = require("@nestjs/common");
const Validate_decorator_1 = require("../decorators/Validate.decorator");
const Result_1 = require("../../result/Result");
let ValidationBehavior = class ValidationBehavior {
    async execute(command, next) {
        if (!(0, Validate_decorator_1.shouldValidate)(command.constructor)) {
            return next();
        }
        const ValidatorClass = (0, Validate_decorator_1.getValidatorClass)(command.constructor);
        if (!ValidatorClass) {
            return next();
        }
        const validator = new ValidatorClass();
        const validationResult = validator.validate(command);
        if (!validationResult.isSuccess) {
            return Result_1.Result.failure(validationResult.errorType ?? Result_1.ErrorType.ValidationError, validationResult.errorMessage ?? 'Validation failed');
        }
        return next();
    }
};
exports.ValidationBehavior = ValidationBehavior;
exports.ValidationBehavior = ValidationBehavior = __decorate([
    (0, common_1.Injectable)()
], ValidationBehavior);
