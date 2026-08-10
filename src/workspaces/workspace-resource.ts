import { NotFoundException } from '@nestjs/common';
import {
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { WorkspaceContext } from './types/workspace-context.type';

type WorkspaceResource = ObjectLiteral & {
  id: string;
  workspaceId: string;
};

type WorkspaceResourceLookupOptions<T extends WorkspaceResource> = Omit<
  FindOneOptions<T>,
  'where'
>;

export async function findWorkspaceResourceOrFail<T extends WorkspaceResource>(
  repository: Repository<T>,
  context: WorkspaceContext,
  resourceId: string,
  options: WorkspaceResourceLookupOptions<T> = {},
): Promise<T> {
  const resource = await repository.findOne({
    ...options,
    where: {
      id: resourceId,
      workspaceId: context.workspace.id,
    } as FindOptionsWhere<T>,
  });

  if (!resource) {
    throw new NotFoundException('Resource not found');
  }

  return resource;
}

export function scopeWorkspaceResourceCreate<T extends ObjectLiteral>(
  context: WorkspaceContext,
  values: T,
): T & { workspaceId: string } {
  return {
    ...values,
    workspaceId: context.workspace.id,
  };
}
