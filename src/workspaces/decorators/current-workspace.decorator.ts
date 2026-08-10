import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WorkspaceContext } from '../types/workspace-context.type';
import { WorkspaceRequest } from '../types/workspace-request.type';

export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceContext => {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();
    return request.workspaceContext;
  },
);
