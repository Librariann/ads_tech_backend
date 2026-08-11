import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { EntitlementService } from '../billing/entitlement.service';
import {
  EntitlementResource,
  UserStatus,
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '../database/entities/enums';
import { WorkspaceMember } from '../database/entities/workspace.entity';
import { User } from '../users/entities/user.entity';
import { WorkspaceInvitationResponseDto } from './dto/workspace-invitation-response.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceContext } from './types/workspace-context.type';

@Injectable()
export class WorkspaceMembersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly entitlementService: EntitlementService,
  ) {}

  inviteByEmail(
    context: WorkspaceContext,
    email: string,
    role: Exclude<WorkspaceRole, WorkspaceRole.OWNER>,
  ) {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const repository = manager.getRepository(WorkspaceMember);
      const user = await manager.getRepository(User).findOne({
        where: { email: email.toLowerCase(), status: UserStatus.ACTIVE },
      });

      if (!user) {
        throw new NotFoundException('Registered user not found');
      }

      const existingMember = await repository.findOne({
        where: { workspaceId: context.workspace.id, userId: user.id },
      });

      if (
        existingMember &&
        existingMember.status !== WorkspaceMemberStatus.DISABLED
      ) {
        throw new ConflictException('User is already a workspace member');
      }

      await this.entitlementService.assertCanConsume(
        context.workspace.id,
        EntitlementResource.WORKSPACE_MEMBERS,
        1,
        manager,
      );

      const invitation = existingMember ?? repository.create();
      invitation.workspaceId = context.workspace.id;
      invitation.userId = user.id;
      invitation.user = user;
      invitation.workspace = context.workspace;
      invitation.role = role;
      invitation.status = WorkspaceMemberStatus.INVITED;
      invitation.joinedAt = undefined;

      const savedInvitation = await repository.save(invitation);
      return WorkspaceInvitationResponseDto.from(savedInvitation);
    });
  }

  findInvitationsForUser(userId: string) {
    return this.dataSource
      .getRepository(WorkspaceMember)
      .find({
        where: {
          userId,
          status: WorkspaceMemberStatus.INVITED,
          workspace: { status: WorkspaceStatus.ACTIVE },
        },
        relations: { workspace: true },
        order: { createdAt: 'DESC' },
      })
      .then((invitations) =>
        invitations.map(WorkspaceInvitationResponseDto.from),
      );
  }

  acceptInvitation(userId: string, invitationId: string) {
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const member = await this.findInvitationOrFail(
        manager,
        userId,
        invitationId,
      );
      await this.entitlementService.assertCanConsume(
        member.workspaceId,
        EntitlementResource.WORKSPACE_MEMBERS,
        0,
        manager,
      );

      member.status = WorkspaceMemberStatus.ACTIVE;
      member.joinedAt = new Date();
      const savedMember = await manager.save(member);
      return WorkspaceResponseDto.from(savedMember.workspace, savedMember.role);
    });
  }

  declineInvitation(userId: string, invitationId: string) {
    return this.dataSource.transaction(async (manager) => {
      const member = await this.findInvitationOrFail(
        manager,
        userId,
        invitationId,
      );
      await manager.remove(member);
      return { declined: true };
    });
  }

  private async findInvitationOrFail(
    manager: EntityManager,
    userId: string,
    invitationId: string,
  ) {
    if (!/^[1-9]\d*$/.test(invitationId)) {
      throw new NotFoundException('Workspace invitation not found');
    }

    const member = await manager.getRepository(WorkspaceMember).findOne({
      where: {
        id: invitationId,
        userId,
        status: WorkspaceMemberStatus.INVITED,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
    });

    if (!member) {
      throw new NotFoundException('Workspace invitation not found');
    }

    return member;
  }
}
