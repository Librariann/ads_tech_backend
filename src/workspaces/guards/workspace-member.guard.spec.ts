import {
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '../../database/entities/enums';
import {
  Workspace,
  WorkspaceMember,
} from '../../database/entities/workspace.entity';
import { WorkspaceMemberGuard } from './workspace-member.guard';

describe('WorkspaceMemberGuard', () => {
  const user: AuthenticatedUser = {
    id: '42',
    email: 'owner@example.com',
    displayName: 'Owner',
    sessionId: 'session-id',
  };
  const workspace = {
    id: '100',
    name: 'Owner workspace',
    status: WorkspaceStatus.ACTIVE,
  } as Workspace;
  const membership = {
    id: '200',
    workspaceId: workspace.id,
    userId: user.id,
    role: WorkspaceRole.OWNER,
    status: WorkspaceMemberStatus.ACTIVE,
    workspace,
  } as WorkspaceMember;
  const repository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<WorkspaceMember>>;

  let guard: WorkspaceMemberGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new WorkspaceMemberGuard(repository);
  });

  it('stores an active membership in the workspace request context', async () => {
    repository.findOne.mockResolvedValue(membership);
    const request = createRequest({ workspaceId: workspace.id });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        workspaceId: workspace.id,
        userId: user.id,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
    });
    expect(request.workspaceContext).toEqual({ workspace, membership });
  });

  it('returns 404 when the user has no active membership', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext(createRequest({ workspaceId: '999' }))),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 404 without querying for an invalid workspace ID', async () => {
    await expect(
      guard.canActivate(
        createContext(createRequest({ workspaceId: 'not-a-number' })),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('returns 401 when the JWT guard did not provide a user', async () => {
    const request = createRequest({ workspaceId: workspace.id });
    delete request.user;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  function createRequest(params: Record<string, string>) {
    return { params, user } as {
      params: Record<string, string>;
      user?: AuthenticatedUser;
      workspaceContext?: unknown;
    };
  }

  function createContext(request: ReturnType<typeof createRequest>) {
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
  }
});
