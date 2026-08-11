import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { WorkspaceRole } from '../database/entities/enums';
import { CurrentWorkspace } from './decorators/current-workspace.decorator';
import { WorkspaceRoles } from './decorators/workspace-roles.decorator';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteWorkspaceMemberDto } from './dto/invite-workspace-member.dto';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspaceContext } from './types/workspace-context.type';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceMembersService } from './workspace-members.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get('invitations')
  findInvitations(@CurrentUser() user: AuthenticatedUser) {
    return this.workspaceMembersService.findInvitationsForUser(user.id);
  }

  @Post('invitations/:invitationId/accept')
  acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invitationId') invitationId: string,
  ) {
    return this.workspaceMembersService.acceptInvitation(user.id, invitationId);
  }

  @Delete('invitations/:invitationId')
  declineInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invitationId') invitationId: string,
  ) {
    return this.workspaceMembersService.declineInvitation(
      user.id,
      invitationId,
    );
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceMemberGuard)
  findOne(@CurrentWorkspace() context: WorkspaceContext) {
    return this.workspacesService.getWorkspace(context);
  }

  @Patch(':workspaceId')
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  update(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateWorkspace(context, updateWorkspaceDto);
  }

  @Get(':workspaceId/members')
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  findMembers(@CurrentWorkspace() context: WorkspaceContext) {
    return this.workspacesService.findMembers(context);
  }

  @Post(':workspaceId/invitations')
  @WorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  inviteMember(
    @CurrentWorkspace() context: WorkspaceContext,
    @Body() invitation: InviteWorkspaceMemberDto,
  ) {
    return this.workspaceMembersService.inviteByEmail(
      context,
      invitation.email,
      invitation.role,
    );
  }
}
