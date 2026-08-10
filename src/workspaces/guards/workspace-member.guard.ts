import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedRequest } from '../../auth/types/authenticated-request.type';
import {
  WorkspaceMemberStatus,
  WorkspaceStatus,
} from '../../database/entities/enums';
import { WorkspaceMember } from '../../database/entities/workspace.entity';
import { WorkspaceRequest } from '../types/workspace-request.type';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMembersRepository: Repository<WorkspaceMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest & Partial<WorkspaceRequest>>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    const workspaceId = request.params.workspaceId;
    if (!this.isPositiveInteger(workspaceId)) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.workspaceMembersRepository.findOne({
      where: {
        workspaceId,
        userId: request.user.id,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: { status: WorkspaceStatus.ACTIVE },
      },
      relations: { workspace: true },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    request.workspaceContext = {
      workspace: membership.workspace,
      membership,
    };

    return true;
  }

  private isPositiveInteger(value: string | undefined): value is string {
    return typeof value === 'string' && /^[1-9]\d*$/.test(value);
  }
}
