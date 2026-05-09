"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircuitBreaker = createCircuitBreaker;
const cockatiel_1 = require("cockatiel");
/**
 * Creates a resilience policy combining retry + circuit breaker.
 * Usage:
 *   const policy = createCircuitBreaker({ consecutiveFailures: 5 });
 *   const result = await policy.execute(() => httpCall());
 */
function createCircuitBreaker(options = {}) {
    const { halfOpenAfterMs = 30_000, consecutiveFailures = 5, maxRetries = 2, } = options;
    const retryPolicy = (0, cockatiel_1.retry)(cockatiel_1.handleAll, {
        maxAttempts: maxRetries,
        backoff: new cockatiel_1.ExponentialBackoff(),
    });
    const breaker = (0, cockatiel_1.circuitBreaker)(cockatiel_1.handleAll, {
        halfOpenAfter: halfOpenAfterMs,
        breaker: new cockatiel_1.ConsecutiveBreaker(consecutiveFailures),
    });
    return (0, cockatiel_1.wrap)(retryPolicy, breaker);
}
//# sourceMappingURL=CircuitBreakerFactory.js.map