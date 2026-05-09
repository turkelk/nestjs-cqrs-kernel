"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantSubscriber = void 0;
const typeorm_1 = require("typeorm");
const TenantBaseEntity_1 = require("../entities/TenantBaseEntity");
const TenantStore_1 = require("../middleware/TenantStore");
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
let TenantSubscriber = class TenantSubscriber {
    listenTo() {
        return TenantBaseEntity_1.TenantBaseEntity;
    }
    async beforeInsert(event) {
        const orgId = event.entity?.organizationId ?? this.getOrgIdFromStore();
        await this.setTenantId(event.queryRunner, orgId);
    }
    async beforeUpdate(event) {
        const orgId = event.entity?.organizationId ?? this.getOrgIdFromStore();
        await this.setTenantId(event.queryRunner, orgId);
    }
    async beforeRemove(event) {
        const orgId = event.entity?.organizationId ?? this.getOrgIdFromStore();
        await this.setTenantId(event.queryRunner, orgId);
    }
    getOrgIdFromStore() {
        return TenantStore_1.tenantStore.getStore()?.organizationId ?? null;
    }
    async setTenantId(queryRunner, organizationId) {
        if (organizationId && UUID_REGEX.test(organizationId)) {
            await queryRunner.query(`SET LOCAL app.current_org_id = '${organizationId}'`);
        }
    }
};
exports.TenantSubscriber = TenantSubscriber;
exports.TenantSubscriber = TenantSubscriber = __decorate([
    (0, typeorm_1.EventSubscriber)()
], TenantSubscriber);
//# sourceMappingURL=TenantSubscriber.js.map