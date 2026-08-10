import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '../../database/entities/enums';
import {
  Workspace,
  WorkspaceMember,
} from '../../database/entities/workspace.entity';
import { WorkspaceContext } from '../types/workspace-context.type';
import { WorkspaceRoleGuard } from './workspace-role.guard';

describe('WorkspaceRoleGuard', () => {
  const workspaceContext = {
    workspace: {
      id: '100',
      status: WorkspaceStatus.ACTIVE,
    } as Workspace,
    membership: {
      id: '200',
      role: WorkspaceRole.MARKETER,
      status: WorkspaceMemberStatus.ACTIVE,
    } as WorkspaceMember,
  };
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;

  let guard: WorkspaceRoleGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new WorkspaceRoleGuard(reflector);
  });

  it('allows any active member when roles are not specified', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext(workspaceContext))).toBe(true);
  });

  it('allows a member whose role is explicitly permitted', () => {
    reflector.getAllAndOverride.mockReturnValue([
      WorkspaceRole.OWNER,
      WorkspaceRole.MARKETER,
    ]);

    expect(guard.canActivate(createContext(workspaceContext))).toBe(true);
  });

  it('returns 403 when the member role is not permitted', () => {
    reflector.getAllAndOverride.mockReturnValue([
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    expect(() => guard.canActivate(createContext(workspaceContext))).toThrow(
      ForbiddenException,
    );
  });

  it('returns 403 when the membership guard did not provide context', () => {
    reflector.getAllAndOverride.mockReturnValue([WorkspaceRole.OWNER]);

    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  function createContext(context: WorkspaceContext | undefined) {
    return {
      getHandler: () => WorkspaceRoleGuard,
      getClass: () => WorkspaceRoleGuard,
      switchToHttp: () => ({
        getRequest: () => ({ workspaceContext: context }),
      }),
    } as unknown as ExecutionContext;
  }
});
