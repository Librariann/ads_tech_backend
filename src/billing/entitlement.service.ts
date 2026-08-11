import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Not, Repository } from 'typeorm';
import { AdAccount } from '../database/entities/advertising.entity';
import {
  PlanEntitlement,
  UsageEvent,
} from '../database/entities/billing.entity';
import {
  AdAccountStatus,
  EntitlementResource,
  UsageResource,
  WorkspaceMemberStatus,
} from '../database/entities/enums';
import { WorkspaceMember } from '../database/entities/workspace.entity';
import {
  EntitlementErrorCode,
  EntitlementLimitExceededException,
  EntitlementNotConfiguredException,
} from './entitlement-errors';
import { ENTITLEMENT_APPROACHING_RATIO } from './plan-policy';
import { CurrentSubscriptionService } from './current-subscription.service';

export type EntitlementCheckResult = {
  resource: EntitlementResource;
  currentUsage: number;
  requestedQuantity: number;
  projectedUsage: number;
  limit: number | null;
  remaining: number | null;
  approaching: boolean;
  code?: EntitlementErrorCode.ENTITLEMENT_LIMIT_APPROACHING;
};

@Injectable()
export class EntitlementService {
  constructor(
    private readonly currentSubscriptionService: CurrentSubscriptionService,
    @InjectRepository(PlanEntitlement)
    private readonly entitlementsRepository: Repository<PlanEntitlement>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMembersRepository: Repository<WorkspaceMember>,
    @InjectRepository(AdAccount)
    private readonly adAccountsRepository: Repository<AdAccount>,
    @InjectRepository(UsageEvent)
    private readonly usageEventsRepository: Repository<UsageEvent>,
  ) {}

  async check(
    workspaceId: string,
    resource: EntitlementResource,
    requestedQuantity = 0,
    manager?: EntityManager,
  ): Promise<EntitlementCheckResult> {
    this.validateRequestedQuantity(requestedQuantity);
    const subscription = await this.currentSubscriptionService.requireCurrent(
      workspaceId,
      new Date(),
      manager,
    );
    const entitlementsRepository = this.getRepository(
      manager,
      PlanEntitlement,
      this.entitlementsRepository,
    );
    const entitlement = await entitlementsRepository.findOne({
      where: { planId: subscription.planId, resource },
    });

    if (!entitlement) {
      throw new EntitlementNotConfiguredException(resource);
    }

    const currentUsage = await this.getCurrentUsage(
      workspaceId,
      resource,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      manager,
    );
    const limit = this.parseLimit(entitlement.limitValue, resource);
    const projectedUsage = currentUsage + requestedQuantity;
    const remaining =
      limit === null ? null : Math.max(limit - projectedUsage, 0);
    const approaching =
      limit !== null &&
      projectedUsage <= limit &&
      projectedUsage >= Math.ceil(limit * ENTITLEMENT_APPROACHING_RATIO);

    return {
      resource,
      currentUsage,
      requestedQuantity,
      projectedUsage,
      limit,
      remaining,
      approaching,
      code: approaching
        ? EntitlementErrorCode.ENTITLEMENT_LIMIT_APPROACHING
        : undefined,
    };
  }

  async assertCanConsume(
    workspaceId: string,
    resource: EntitlementResource,
    requestedQuantity = 1,
    manager?: EntityManager,
  ) {
    const result = await this.check(
      workspaceId,
      resource,
      requestedQuantity,
      manager,
    );

    if (result.limit !== null && result.projectedUsage > result.limit) {
      throw new EntitlementLimitExceededException(
        resource,
        result.currentUsage,
        requestedQuantity,
        result.limit,
      );
    }

    return result;
  }

  private async getCurrentUsage(
    workspaceId: string,
    resource: EntitlementResource,
    periodStart: Date,
    periodEnd: Date,
    manager?: EntityManager,
  ) {
    if (resource === EntitlementResource.WORKSPACE_MEMBERS) {
      return this.getRepository(
        manager,
        WorkspaceMember,
        this.workspaceMembersRepository,
      ).count({
        where: {
          workspaceId,
          status: In([
            WorkspaceMemberStatus.INVITED,
            WorkspaceMemberStatus.ACTIVE,
          ]),
        },
      });
    }

    if (resource === EntitlementResource.AD_ACCOUNTS) {
      return this.getRepository(
        manager,
        AdAccount,
        this.adAccountsRepository,
      ).count({
        where: {
          workspaceId,
          status: Not(AdAccountStatus.DISCONNECTED),
        },
      });
    }

    const usageResources =
      resource === EntitlementResource.AI_REQUESTS
        ? [UsageResource.AI_REQUESTS]
        : [UsageResource.AI_INPUT_TOKENS, UsageResource.AI_OUTPUT_TOKENS];
    const usageRepository = this.getRepository(
      manager,
      UsageEvent,
      this.usageEventsRepository,
    );
    const result = await usageRepository
      .createQueryBuilder('usage')
      .select('COALESCE(SUM(usage.quantity), 0)', 'total')
      .where('usage.workspace_id = :workspaceId', { workspaceId })
      .andWhere('usage.resource IN (:...resources)', {
        resources: usageResources,
      })
      .andWhere('usage.occurred_at >= :periodStart', { periodStart })
      .andWhere('usage.occurred_at < :periodEnd', { periodEnd })
      .getRawOne<{ total: string }>();

    return this.parseNonNegativeInteger(result?.total ?? '0', resource);
  }

  private getRepository<T>(
    manager: EntityManager | undefined,
    entity: new () => T,
    repository: Repository<T>,
  ) {
    return manager ? manager.getRepository(entity) : repository;
  }

  private parseLimit(value: string | undefined, resource: EntitlementResource) {
    return value === undefined || value === null
      ? null
      : this.parseNonNegativeInteger(value, resource);
  }

  private parseNonNegativeInteger(
    value: string,
    resource: EntitlementResource,
  ) {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new EntitlementNotConfiguredException(resource);
    }
    return parsed;
  }

  private validateRequestedQuantity(value: number) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError('requestedQuantity must be a non-negative integer');
    }
  }
}
