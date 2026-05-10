import { NestMiddleware } from '@nestjs/common';
export interface TenantContext {
    organizationId: string | null;
}
export declare class TenantContextMiddleware implements NestMiddleware {
    use(req: any, _res: any, next: () => void): void;
}
