import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const Public: () => (target: object, _key?: string | symbol, descriptor?: PropertyDescriptor) => void;
export interface JwtPayload {
    sub: string;
    email: string;
    realm_access?: {
        roles: string[];
    };
    org_id?: string;
    organization?: Record<string, {
        id?: string;
        [key: string]: unknown;
    }>;
    preferred_username?: string;
}
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly logger;
    private readonly client;
    private readonly issuer;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private verifyToken;
}
