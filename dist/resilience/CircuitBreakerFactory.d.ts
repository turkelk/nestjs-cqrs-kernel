export interface CircuitBreakerOptions {
    halfOpenAfterMs?: number;
    consecutiveFailures?: number;
    maxRetries?: number;
}
/**
 * Creates a resilience policy combining retry + circuit breaker.
 * Usage:
 *   const policy = createCircuitBreaker({ consecutiveFailures: 5 });
 *   const result = await policy.execute(() => httpCall());
 */
export declare function createCircuitBreaker(options?: CircuitBreakerOptions): import("cockatiel").IMergedPolicy<import("cockatiel").IRetryContext & import("cockatiel").IDefaultPolicyContext, never, [import("cockatiel").RetryPolicy, import("cockatiel").CircuitBreakerPolicy]>;
//# sourceMappingURL=CircuitBreakerFactory.d.ts.map