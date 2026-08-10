import { WorkspaceRole, WorkspaceStatus } from '../../database/entities/enums';
import { Workspace } from '../../database/entities/workspace.entity';

export class WorkspaceResponseDto {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  defaultCurrency: string;
  timezone: string;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;

  static from(workspace: Workspace, role: WorkspaceRole) {
    return Object.assign(new WorkspaceResponseDto(), {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      status: workspace.status,
      defaultCurrency: workspace.defaultCurrency,
      timezone: workspace.timezone,
      role,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  }
}
