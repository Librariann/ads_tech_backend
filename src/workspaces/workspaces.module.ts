import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingModule } from '../billing/billing.module';
import {
  Workspace,
  WorkspaceMember,
} from '../database/entities/workspace.entity';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember]),
    BillingModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceMembersService,
    WorkspaceMemberGuard,
    WorkspaceRoleGuard,
  ],
  exports: [
    WorkspacesService,
    WorkspaceMembersService,
    WorkspaceMemberGuard,
    WorkspaceRoleGuard,
  ],
})
export class WorkspacesModule {}
