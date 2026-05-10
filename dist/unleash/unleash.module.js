"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UnleashModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnleashModule = void 0;
const common_1 = require("@nestjs/common");
const unleash_client_1 = require("unleash-client");
const FeatureFlagBehavior_1 = require("../cqrs/behaviors/FeatureFlagBehavior");
let UnleashModule = UnleashModule_1 = class UnleashModule {
    static forRoot(options) {
        const unleashProvider = {
            provide: unleash_client_1.Unleash,
            useFactory: () => {
                const logger = new common_1.Logger('UnleashModule');
                const url = options?.url || process.env['UNLEASH_URL'] || 'http://localhost:4242/api';
                const appName = options?.appName || process.env['UNLEASH_APP_NAME'] || 'arex';
                const token = options?.customHeaders?.['Authorization'] ||
                    process.env['UNLEASH_API_TOKEN'] ||
                    '*:*.unleash-insecure-api-token';
                logger.log(`Connecting to Unleash at ${url}`);
                return (0, unleash_client_1.initialize)({
                    url,
                    appName,
                    customHeaders: {
                        Authorization: token,
                    },
                    refreshInterval: 10000,
                });
            },
        };
        return {
            module: UnleashModule_1,
            providers: [unleashProvider, FeatureFlagBehavior_1.FeatureFlagBehavior],
            exports: [unleash_client_1.Unleash, FeatureFlagBehavior_1.FeatureFlagBehavior],
        };
    }
};
exports.UnleashModule = UnleashModule;
exports.UnleashModule = UnleashModule = UnleashModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], UnleashModule);
