import { AsyncLocalStorage } from 'async_hooks';

export interface CorrelationStoreData {
  correlationId: string;
  userId?: string;
  organizationId?: string;
}

/**
 * Request-scoped async local storage for correlation context.
 * Set by CorrelationIdMiddleware, read by LogBehavior and error filters.
 */
export const correlationStore = new AsyncLocalStorage<CorrelationStoreData>();
