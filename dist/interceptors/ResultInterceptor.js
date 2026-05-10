"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResultInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const Result_1 = require("../result/Result");
let ResultInterceptor = ResultInterceptor_1 = class ResultInterceptor {
    logger = new common_1.Logger(ResultInterceptor_1.name);
    intercept(_context, next) {
        return next.handle().pipe((0, rxjs_1.map)((data) => {
            if (data instanceof Result_1.Result && !data.isSuccess) {
                throw data;
            }
            return data;
        }), (0, rxjs_1.catchError)((error) => {
            if (error instanceof Result_1.Result) {
                throw error;
            }
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger.error({
                msg: 'Unhandled exception before CQRS pipeline',
                error: err.message,
                stack: err.stack,
            });
            throw Result_1.Result.failure(Result_1.ErrorType.InternalError, err.message);
        }));
    }
};
exports.ResultInterceptor = ResultInterceptor;
exports.ResultInterceptor = ResultInterceptor = ResultInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], ResultInterceptor);
//# sourceMappingURL=ResultInterceptor.js.map