"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const constants_1 = require("../cqrs/constants");
let RedisModule = class RedisModule {
    static { RedisModule_1 = this; }
    static logger = new common_1.Logger('RedisModule');
    static forRoot(options = {}) {
        const redisProvider = {
            provide: constants_1.REDIS_CLIENT,
            useFactory: () => {
                const url = options.url || process.env.REDIS_URL || 'redis://localhost:6379';
                const client = new ioredis_1.default(url, {
                    maxRetriesPerRequest: 3,
                    retryStrategy(times) {
                        const delay = Math.min(times * 200, 5000);
                        RedisModule_1.logger.warn(`Redis reconnecting (attempt ${times}, delay ${delay}ms)`);
                        return delay;
                    },
                });
                client.on('connect', () => RedisModule_1.logger.log('Redis connected'));
                client.on('error', (err) => RedisModule_1.logger.error('Redis error', err.message));
                return client;
            },
        };
        return {
            module: RedisModule_1,
            providers: [redisProvider],
            exports: [constants_1.REDIS_CLIENT],
        };
    }
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = RedisModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], RedisModule);
