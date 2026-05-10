import { AsyncLocalStorage } from 'async_hooks';
export interface TenantStoreData {
    organizationId: string | null;
}
/**
 * Request-scoped async local storage for tenant context.
 * Set by TenantContextMiddleware, read by TenantSubscriber.
 */
export declare const tenantStore: AsyncLocalStorage<TenantStoreData>;
