import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { UserInfo } from './interfaces/user-info.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: CustomLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserInfo = request.user;

    if (!user) {
      this.logger.logSecurityEvent(
        'UNAUTHENTICATED_ACCESS_ATTEMPT',
        { requiredRoles },
        'Access denied: user not authenticated'
      );
      return false;
    }

    if (!user.role) {
      this.logger.logSecurityEvent(
        'MISSING_USER_ROLE',
        { userId: user.id },
        'Access denied: user role not found'
      );
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      this.logger.logSecurityEvent(
        'INSUFFICIENT_ROLE_ACCESS',
        { 
          userId: user.id, 
          userRole: user.role, 
          requiredRoles 
        },
        'Access denied due to insufficient role'
      );
    }

    return hasRole;
  }
}