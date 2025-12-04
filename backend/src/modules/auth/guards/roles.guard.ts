import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // SUPER_ADMIN can access everything that ADMIN or BRANCH_ADMIN can access
    if (user.role === Role.SUPER_ADMIN) {
      // Check if any admin-level role is required
      const adminRoles: Role[] = [Role.ADMIN, Role.BRANCH_ADMIN, Role.SUPER_ADMIN];
      if (requiredRoles.some((role) => adminRoles.includes(role))) {
        return true;
      }
    }

    // ADMIN is treated as BRANCH_ADMIN (legacy support)
    if (user.role === Role.ADMIN) {
      if (requiredRoles.includes(Role.BRANCH_ADMIN)) {
        return true;
      }
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
