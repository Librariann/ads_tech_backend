import { Transform } from 'class-transformer';
import { IsEmail, IsIn } from 'class-validator';
import { WorkspaceRole } from '../../database/entities/enums';

const INVITABLE_ROLES = [
  WorkspaceRole.ADMIN,
  WorkspaceRole.MARKETER,
  WorkspaceRole.VIEWER,
];

export class InviteWorkspaceMemberDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsIn(INVITABLE_ROLES)
  role: Exclude<WorkspaceRole, WorkspaceRole.OWNER>;
}
