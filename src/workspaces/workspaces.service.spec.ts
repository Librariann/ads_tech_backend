import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  UserStatus,
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '../database/entities/enums';
import {
  Workspace,
  WorkspaceMember,
} from '../database/entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceContext } from './types/workspace-context.type';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const createdAt = new Date('2026-08-10T00:00:00.000Z');
  const updatedAt = new Date('2026-08-10T01:00:00.000Z');
  const workspace = {
    id: '100',
    name: 'Owner workspace',
    slug: 'personal-42',
    status: WorkspaceStatus.ACTIVE,
    defaultCurrency: 'KRW',
    timezone: 'Asia/Seoul',
    createdById: '42',
    createdAt,
    updatedAt,
  } as Workspace;
  const membership = {
    id: '200',
    workspaceId: workspace.id,
    userId: '42',
    role: WorkspaceRole.OWNER,
    status: WorkspaceMemberStatus.ACTIVE,
    workspace,
    joinedAt: createdAt,
    createdAt,
  } as WorkspaceMember;
  const context: WorkspaceContext = { workspace, membership };
  const workspacesRepository = {
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<Workspace>>;
  const workspaceMembersRepository = {
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<WorkspaceMember>>;

  let service: WorkspacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkspacesService(
      workspacesRepository,
      workspaceMembersRepository,
    );
  });

  it('lists only active memberships in active workspaces', async () => {
    workspaceMembersRepository.find.mockResolvedValue([membership]);

    await expect(service.findAllForUser('42')).resolves.toEqual([
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        status: workspace.status,
        defaultCurrency: workspace.defaultCurrency,
        timezone: workspace.timezone,
        role: WorkspaceRole.OWNER,
        createdAt,
        updatedAt,
      },
    ]);
    expect(workspaceMembersRepository.find).toHaveBeenCalledWith({
      where: {
        userId: '42',
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
      order: { createdAt: 'ASC' },
    });
  });

  it('updates only allowed fields on the context workspace', async () => {
    const isolatedWorkspace = { ...workspace } as Workspace;
    const isolatedContext = { ...context, workspace: isolatedWorkspace };
    workspacesRepository.save.mockResolvedValue(isolatedWorkspace);

    await service.updateWorkspace(isolatedContext, {
      name: 'Updated workspace',
      timezone: 'UTC',
      id: '999',
    } as never);

    expect(workspacesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: workspace.id,
        name: 'Updated workspace',
        timezone: 'UTC',
      }),
    );
  });

  it('rejects an invalid timezone', async () => {
    await expect(
      service.updateWorkspace(context, { timezone: 'Invalid/Timezone' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(workspacesRepository.save).not.toHaveBeenCalled();
  });

  it('returns member DTOs without password or OAuth data', async () => {
    const user = {
      id: '42',
      email: 'owner@example.com',
      displayName: 'Owner',
      passwordHash: 'secret-hash',
      oauthAccounts: [{ id: '300' }],
      status: UserStatus.ACTIVE,
    } as User;
    workspaceMembersRepository.find.mockResolvedValue([
      { ...membership, user } as WorkspaceMember,
    ]);

    const result = await service.findMembers(context);

    expect(result).toEqual([
      {
        id: membership.id,
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
        createdAt: membership.createdAt,
      },
    ]);
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(result[0]).not.toHaveProperty('oauthAccounts');
    expect(result[0]).not.toHaveProperty('user');
  });
});
