"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantStore = void 0;
const async_hooks_1 = require("async_hooks");
/**
 * Request-scoped async local storage for tenant context.
 * Set by TenantContextMiddleware, read by TenantSubscriber.
 */
exports.tenantStore = new async_hooks_1.AsyncLocalStorage();
//# sourceMappingURL=TenantStore.js.map