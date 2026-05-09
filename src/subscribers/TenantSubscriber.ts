import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { TenantBaseEntity } from '../entities/TenantBaseEntity';
import { tenantStore } from '../middleware/TenantStore';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface<TenantBaseEntity> {
  listenTo() {
    return TenantBaseEntity;
  }

  async beforeInsert(event: InsertEvent<TenantBaseEntity>): Promise<void> {
    const orgId = event.entity?.organizationId ?? this.getOrgIdFromStore();
    await this.setTenantId(event.queryRunner, orgId);
  }

  async beforeUpdate(event: UpdateEvent<TenantBaseEntity>): Promise<void> {
    const orgId = event.entity?.organizationId ?? this.getOrgIdFromStore();
    await this.setTenantId(event.queryRunner, orgId);
  }

  async beforeRemove(event: RemoveEvent<TenantBaseEntity>): Promise<void> {
    const orgId = event.entity?.organizationId ?? this.getOrgIdFromStore();
    await this.setTenantId(event.queryRunner, orgId);
  }

  private getOrgIdFromStore(): string | null {
    return tenantStore.getStore()?.organizationId ?? null;
  }

  private async setTenantId(queryRunner: any, organizationId?: string | null): Promise<void> {
    if (organizationId && UUID_REGEX.test(organizationId)) {
      await queryRunner.query(`SET LOCAL app.current_org_id = '${organizationId}'`);
    }
  }
}
