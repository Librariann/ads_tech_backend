import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EntitlementLimitExceededException } from '../billing/entitlement-errors';
import { EntitlementService } from '../billing/entitlement.service';
import {
  EntitlementResource,
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
import { WorkspaceMembersService } from './workspace-members.service';

describe('WorkspaceMembersService entitlement enforcement', () => {
  const workspace = {
    id: '100',
    status: WorkspaceStatus.ACTIVE,
  } as Workspace;
  const ownerMembership = {
    id: '200',
    workspaceId: workspace.id,
    userId: '42',
    role: WorkspaceRole.OWNER,
    status: WorkspaceMemberStatus.ACTIVE,
  } as WorkspaceMember;
  const context: WorkspaceContext = {
    workspace,
    membership: ownerMembership,
  };
  const invitedMember = {
    id: '201',
    workspaceId: workspace.id,
    userId: '43',
    role: WorkspaceRole.MARKETER,
    status: WorkspaceMemberStatus.INVITED,
    workspace,
  } as WorkspaceMember;
  const membersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<WorkspaceMember>>;
  const invitedUser = {
    id: '43',
    email: 'member@example.com',
    status: UserStatus.ACTIVE,
  } as User;
  const usersRepository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;
  const manager = {
    getRepository: jest.fn((entity: unknown) =>
      entity === User ? usersRepository : membersRepository,
    ),
    save: jest.fn(),
    remove: jest.fn(),
  } as unknown as EntityManager;
  const dataSource = {
    transaction: jest.fn(
      async (
        isolationOrCallback:
          | string
          | ((transactionManager: EntityManager) => unknown),
        optionalCallback?: (transactionManager: EntityManager) => unknown,
      ) =>
        typeof isolationOrCallback === 'function'
          ? isolationOrCallback(manager)
          : optionalCallback(manager),
    ),
    getRepository: jest.fn(() => membersRepository),
  } as unknown as DataSource;
  const entitlementService = {
    assertCanConsume: jest.fn(),
  } as unknown as jest.Mocked<EntitlementService>;
  let service: WorkspaceMembersService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersRepository.findOne.mockResolvedValue(invitedUser);
    membersRepository.findOne.mockResolvedValue(null);
    membersRepository.create.mockReturnValue({} as WorkspaceMember);
    membersRepository.save.mockResolvedValue(invitedMember);
    entitlementService.assertCanConsume.mockResolvedValue({} as never);
    service = new WorkspaceMembersService(dataSource, entitlementService);
  });

  it('checks member capacity before saving an invitation', async () => {
    await expect(
      service.inviteByEmail(context, invitedUser.email, WorkspaceRole.MARKETER),
    ).resolves.toEqual({
      id: invitedMember.id,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      role: invitedMember.role,
      invitedAt: invitedMember.createdAt,
    });

    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: {
        email: invitedUser.email,
        status: UserStatus.ACTIVE,
      },
    });

    expect(entitlementService.assertCanConsume).toHaveBeenCalledWith(
      workspace.id,
      EntitlementResource.WORKSPACE_MEMBERS,
      1,
      manager,
    );
    expect(membersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: workspace.id,
        userId: invitedUser.id,
        role: WorkspaceRole.MARKETER,
        status: WorkspaceMemberStatus.INVITED,
        workspace,
        user: invitedUser,
      }),
    );
    expect(
      entitlementService.assertCanConsume.mock.invocationCallOrder[0],
    ).toBeLessThan(membersRepository.save.mock.invocationCallOrder[0]);
  });

  it('does not save an invitation when the member limit is exceeded', async () => {
    entitlementService.assertCanConsume.mockRejectedValue(
      new EntitlementLimitExceededException(
        EntitlementResource.WORKSPACE_MEMBERS,
        2,
        1,
        2,
      ),
    );

    await expect(
      service.inviteByEmail(context, invitedUser.email, WorkspaceRole.VIEWER),
    ).rejects.toBeInstanceOf(EntitlementLimitExceededException);
    expect(membersRepository.save).not.toHaveBeenCalled();
  });

  it('does not consume another seat when accepting a reserved invitation', async () => {
    membersRepository.findOne.mockResolvedValue(invitedMember);
    (manager.save as jest.Mock).mockResolvedValue({
      ...invitedMember,
      status: WorkspaceMemberStatus.ACTIVE,
    });

    await service.acceptInvitation(invitedUser.id, invitedMember.id);

    expect(entitlementService.assertCanConsume).toHaveBeenCalledWith(
      workspace.id,
      EntitlementResource.WORKSPACE_MEMBERS,
      0,
      manager,
    );
    expect(membersRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: invitedMember.id,
        userId: invitedUser.id,
        status: WorkspaceMemberStatus.INVITED,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
    });
  });

  it('lists pending invitations only for the authenticated user', async () => {
    membersRepository.find.mockResolvedValue([invitedMember]);

    await service.findInvitationsForUser(invitedUser.id);

    expect(membersRepository.find).toHaveBeenCalledWith({
      where: {
        userId: invitedUser.id,
        status: WorkspaceMemberStatus.INVITED,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
      order: { createdAt: 'DESC' },
    });
  });

  it("does not accept another user's invitation ID", async () => {
    membersRepository.findOne.mockResolvedValue(null);

    await expect(
      service.acceptInvitation('999', invitedMember.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(entitlementService.assertCanConsume).not.toHaveBeenCalled();
  });
});
