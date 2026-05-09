import { Injectable, NestMiddleware } from '@nestjs/common';
import { tenantStore } from './TenantStore';

export interface TenantContext {
  organizationId: string | null;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void): void {
    // Extract org_id from JWT payload (set by JwtAuthGuard)
    const orgId = req.user?.organizationId || req.headers['x-tenant-id'] || null;
    req.tenantId = orgId;
    req.tenantContext = { organizationId: orgId } as TenantContext;

    // Store in AsyncLocalStorage so TenantSubscriber can access it
    tenantStore.run({ organizationId: orgId }, () => {
      next();
    });
  }
}
