"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationStore = void 0;
const async_hooks_1 = require("async_hooks");
/**
 * Request-scoped async local storage for correlation context.
 * Set by CorrelationIdMiddleware, read by LogBehavior and error filters.
 */
exports.correlationStore = new async_hooks_1.AsyncLocalStorage();
