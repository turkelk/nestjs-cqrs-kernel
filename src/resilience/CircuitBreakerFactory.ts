import { circuitBreaker, ConsecutiveBreaker, handleAll, retry, wrap, ExponentialBackoff } from 'cockatiel';

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
export function createCircuitBreaker(options: CircuitBreakerOptions = {}) {
  const {
    halfOpenAfterMs = 30_000,
    consecutiveFailures = 5,
    maxRetries = 2,
  } = options;

  const retryPolicy = retry(handleAll, {
    maxAttempts: maxRetries,
    backoff: new ExponentialBackoff(),
  });

  const breaker = circuitBreaker(handleAll, {
    halfOpenAfter: halfOpenAfterMs,
    breaker: new ConsecutiveBreaker(consecutiveFailures),
  });

  return wrap(retryPolicy, breaker);
}
