import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Workspace,
  WorkspaceMember,
} from '../database/entities/workspace.entity';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember])],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMemberGuard, WorkspaceRoleGuard],
  exports: [WorkspacesService, WorkspaceMemberGuard, WorkspaceRoleGuard],
})
export class WorkspacesModule {}
