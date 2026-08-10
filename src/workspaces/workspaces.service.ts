import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceMemberStatus,
  WorkspaceStatus,
} from '../database/entities/enums';
import {
  Workspace,
  WorkspaceMember,
} from '../database/entities/workspace.entity';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceContext } from './types/workspace-context.type';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspacesRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMembersRepository: Repository<WorkspaceMember>,
  ) {}

  async findAllForUser(userId: string) {
    const memberships = await this.workspaceMembersRepository.find({
      where: {
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
      order: { createdAt: 'ASC' },
    });

    return memberships.map((membership) =>
      WorkspaceResponseDto.from(membership.workspace, membership.role),
    );
  }

  getWorkspace(context: WorkspaceContext) {
    return WorkspaceResponseDto.from(
      context.workspace,
      context.membership.role,
    );
  }

  async updateWorkspace(
    context: WorkspaceContext,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    if (updateWorkspaceDto.timezone !== undefined) {
      this.validateTimezone(updateWorkspaceDto.timezone);
    }

    if (updateWorkspaceDto.name !== undefined) {
      context.workspace.name = updateWorkspaceDto.name;
    }
    if (updateWorkspaceDto.defaultCurrency !== undefined) {
      context.workspace.defaultCurrency = updateWorkspaceDto.defaultCurrency;
    }
    if (updateWorkspaceDto.timezone !== undefined) {
      context.workspace.timezone = updateWorkspaceDto.timezone;
    }

    const savedWorkspace = await this.workspacesRepository.save(
      context.workspace,
    );

    return WorkspaceResponseDto.from(savedWorkspace, context.membership.role);
  }

  async findMembers(context: WorkspaceContext) {
    const members = await this.workspaceMembersRepository.find({
      where: { workspaceId: context.workspace.id },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    return members.map(WorkspaceMemberResponseDto.from);
  }

  private validateTimezone(timezone: string) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    } catch {
      throw new BadRequestException('Invalid timezone');
    }
  }
}
