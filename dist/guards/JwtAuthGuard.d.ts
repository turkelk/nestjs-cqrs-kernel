import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const Public: () => (target: object, _key?: string | symbol, descriptor?: PropertyDescriptor) => void;
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
}
export {};
