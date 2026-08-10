import { AuthenticatedRequest } from '../../auth/types/authenticated-request.type';
import { WorkspaceContext } from './workspace-context.type';

export type WorkspaceRequest = AuthenticatedRequest & {
  workspaceContext: WorkspaceContext;
};
