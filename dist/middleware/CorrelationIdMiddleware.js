"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationIdMiddleware = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const CorrelationStore_1 = require("./CorrelationStore");
const CORRELATION_ID_HEADER = 'X-Correlation-ID';
let CorrelationIdMiddleware = class CorrelationIdMiddleware {
    use(req, res, next) {
        const correlationId = req.headers[CORRELATION_ID_HEADER.toLowerCase()] || (0, uuid_1.v4)();
        req.correlationId = correlationId;
        req.headers[CORRELATION_ID_HEADER.toLowerCase()] = correlationId;
        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        const storeData = {
            correlationId,
            userId: req.user?.keycloakId,
            organizationId: req.user?.organizationId,
        };
        CorrelationStore_1.correlationStore.run(storeData, () => {
            next();
        });
    }
};
exports.CorrelationIdMiddleware = CorrelationIdMiddleware;
exports.CorrelationIdMiddleware = CorrelationIdMiddleware = __decorate([
    (0, common_1.Injectable)()
], CorrelationIdMiddleware);
//# sourceMappingURL=CorrelationIdMiddleware.js.map