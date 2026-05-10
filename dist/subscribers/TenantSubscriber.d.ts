import { EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { TenantBaseEntity } from '../entities/TenantBaseEntity';
/**
 * TypeORM subscriber that sets PostgreSQL session variable `app.current_org_id`
 * before write operations on tenant-scoped entities. This enables RLS policies.
 *
 * For SELECT queries, RLS is enforced via the session variable set by the
 * TransactionalBehavior or manually via `SET LOCAL app.current_org_id`.
 *
 * Register this subscriber in each service's TypeORM DataSource config:
 *   subscribers: [TenantSubscriber]
 */
export declare class TenantSubscriber implements EntitySubscriberInterface<TenantBaseEntity> {
    listenTo(): typeof TenantBaseEntity;
    beforeInsert(event: InsertEvent<TenantBaseEntity>): Promise<void>;
    beforeUpdate(event: UpdateEvent<TenantBaseEntity>): Promise<void>;
    beforeRemove(event: RemoveEvent<TenantBaseEntity>): Promise<void>;
    private getOrgIdFromStore;
    private setTenantId;
}
