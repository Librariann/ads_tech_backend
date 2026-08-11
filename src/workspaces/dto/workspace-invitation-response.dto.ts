import { WorkspaceRole } from '../../database/entities/enums';
import { WorkspaceMember } from '../../database/entities/workspace.entity';

export class WorkspaceInvitationResponseDto {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  invitedAt: Date;

  static from(member: WorkspaceMember) {
    return Object.assign(new WorkspaceInvitationResponseDto(), {
      id: member.id,
      workspaceId: member.workspaceId,
      workspaceName: member.workspace.name,
      role: member.role,
      invitedAt: member.createdAt,
    });
  }
}
