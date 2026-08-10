import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { WorkspaceRole } from '../database/entities/enums';
import { CurrentWorkspace } from './decorators/current-workspace.decorator';
import { WorkspaceRoles } from './decorators/workspace-roles.decorator';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspaceContext } from './types/workspace-context.type';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.workspacesService.findAllForUser(user.id);
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
}
