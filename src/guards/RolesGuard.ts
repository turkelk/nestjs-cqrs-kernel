import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]): ClassDecorator & MethodDecorator =>
  (target: object, _key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value!);
    } else {
      Reflect.defineMetadata(ROLES_KEY, roles, target);
    }
  };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userRoles: string[] = request.user?.roles || [];

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    return true;
  }
}
