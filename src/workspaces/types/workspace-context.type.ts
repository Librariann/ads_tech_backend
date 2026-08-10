import {
  Workspace,
  WorkspaceMember,
} from '../../database/entities/workspace.entity';

export type WorkspaceContext = {
  workspace: Workspace;
  membership: WorkspaceMember;
};
