"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FeatureFlagBehavior_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagBehavior = void 0;
const common_1 = require("@nestjs/common");
const unleash_client_1 = require("unleash-client");
const FeatureFlag_decorator_1 = require("../decorators/FeatureFlag.decorator");
const Result_1 = require("../../result/Result");
let FeatureFlagBehavior = FeatureFlagBehavior_1 = class FeatureFlagBehavior {
    unleash;
    logger = new common_1.Logger(FeatureFlagBehavior_1.name);
    constructor(unleash) {
        this.unleash = unleash;
    }
    async execute(command, next) {
        const metadata = (0, FeatureFlag_decorator_1.getFeatureFlagMetadata)(command.constructor);
        if (!metadata) {
            return next();
        }
        if (!this.unleash) {
            this.logger.debug('Unleash not configured, skipping feature flag check');
            return next();
        }
        const { flagName, fallback, defaultValue } = metadata;
        const isEnabled = this.unleash.isEnabled(flagName);
        if (isEnabled) {
            return next();
        }
        this.logger.warn(`Feature flag "${flagName}" is disabled, applying fallback: ${fallback}`);
        switch (fallback) {
            case 'skip':
                return Result_1.Result.success(undefined);
            case 'default':
                return Result_1.Result.success(defaultValue);
            case 'throw':
            default:
                return Result_1.Result.failure(Result_1.ErrorType.Forbidden, `Feature "${flagName}" is currently disabled`);
        }
    }
};
exports.FeatureFlagBehavior = FeatureFlagBehavior;
exports.FeatureFlagBehavior = FeatureFlagBehavior = FeatureFlagBehavior_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [unleash_client_1.Unleash])
], FeatureFlagBehavior);
