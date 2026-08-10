import {
  WorkspaceMemberStatus,
  WorkspaceRole,
} from '../../database/entities/enums';
import { WorkspaceMember } from '../../database/entities/workspace.entity';

export class WorkspaceMemberResponseDto {
  id: string;
  userId: string;
  email: string;
  displayName?: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  joinedAt?: Date;
  createdAt: Date;

  static from(member: WorkspaceMember) {
    return Object.assign(new WorkspaceMemberResponseDto(), {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      displayName: member.user.displayName,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      createdAt: member.createdAt,
    });
  }
}
