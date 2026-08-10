import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '../../database/entities/enums';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';
import { WorkspaceRequest } from '../types/workspace-request.type';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles?.length) {
      return true;
    }

    const workspaceContext = context
      .switchToHttp()
      .getRequest<Partial<WorkspaceRequest>>().workspaceContext;

    if (
      !workspaceContext ||
      !allowedRoles.includes(workspaceContext.membership.role)
    ) {
      throw new ForbiddenException('Insufficient workspace role');
    }

    return true;
  }
}
