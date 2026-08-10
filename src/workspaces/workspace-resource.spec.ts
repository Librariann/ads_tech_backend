import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '../database/entities/enums';
import {
  Workspace,
  WorkspaceMember,
} from '../database/entities/workspace.entity';
import { WorkspaceContext } from './types/workspace-context.type';
import {
  findWorkspaceResourceOrFail,
  scopeWorkspaceResourceCreate,
} from './workspace-resource';

type TestResource = {
  id: string;
  workspaceId: string;
  name: string;
};

describe('workspace resource tenant isolation', () => {
  const workspace = {
    id: '100',
    status: WorkspaceStatus.ACTIVE,
  } as Workspace;
  const membership = {
    id: '200',
    workspaceId: workspace.id,
    userId: '42',
    role: WorkspaceRole.MARKETER,
    status: WorkspaceMemberStatus.ACTIVE,
  } as WorkspaceMember;
  const context: WorkspaceContext = { workspace, membership };
  const repository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<TestResource>>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('looks up a resource by both resource ID and context workspace ID', async () => {
    const resource = {
      id: '300',
      workspaceId: workspace.id,
      name: 'Campaign',
    };
    repository.findOne.mockResolvedValue(resource);

    await expect(
      findWorkspaceResourceOrFail(repository, context, resource.id),
    ).resolves.toBe(resource);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        id: resource.id,
        workspaceId: workspace.id,
      },
    });
  });

  it('returns 404 when the ID exists only in another workspace', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      findWorkspaceResourceOrFail(repository, context, '999'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        id: '999',
        workspaceId: workspace.id,
      },
    });
  });

  it('overrides a body workspaceId with the authenticated context ID', () => {
    expect(
      scopeWorkspaceResourceCreate(context, {
        workspaceId: '999',
        name: 'Campaign',
      }),
    ).toEqual({
      workspaceId: workspace.id,
      name: 'Campaign',
    });
  });
});
