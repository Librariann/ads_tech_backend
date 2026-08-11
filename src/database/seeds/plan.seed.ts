import { EntityManager, In } from 'typeorm';
import {
  CURRENT_PLAN_VERSION,
  PLAN_POLICIES,
  STARTER_PLAN_CODE,
} from '../../billing/plan-policy';
import {
  Plan,
  PlanEntitlement,
  Subscription,
} from '../entities/billing.entity';
import {
  EntitlementResource,
  PaymentProvider,
  SubscriptionStatus,
} from '../entities/enums';
import { Workspace } from '../entities/workspace.entity';

const OPEN_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

export async function seedPlanPolicies(manager: EntityManager) {
  const plansRepository = manager.getRepository(Plan);
  const entitlementsRepository = manager.getRepository(PlanEntitlement);

  for (const policy of PLAN_POLICIES) {
    await plansRepository.upsert(
      {
        code: policy.code,
        name: policy.name,
        version: policy.version,
        billingInterval: policy.billingInterval,
        priceAmount: policy.priceAmount,
        currency: policy.currency,
        isActive: true,
      },
      ['code', 'version'],
    );

    await plansRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: false })
      .where('code = :code', { code: policy.code })
      .andWhere('version <> :version', { version: policy.version })
      .execute();

    const plan = await plansRepository.findOneByOrFail({
      code: policy.code,
      version: policy.version,
    });

    await entitlementsRepository.upsert(
      Object.entries(policy.entitlements).map(([resource, entitlement]) => ({
        planId: plan.id,
        resource: resource as EntitlementResource,
        limitValue: entitlement.limitValue,
        resetInterval: entitlement.resetInterval,
      })),
      ['planId', 'resource'],
    );
  }

  await backfillStarterSubscriptions(manager);
}

async function backfillStarterSubscriptions(manager: EntityManager) {
  const starterPlan = await manager.getRepository(Plan).findOneByOrFail({
    code: STARTER_PLAN_CODE,
    version: CURRENT_PLAN_VERSION,
    isActive: true,
  });
  const workspaces = await manager.getRepository(Workspace).find({
    select: { id: true },
  });

  if (workspaces.length === 0) {
    return;
  }

  const subscriptionsRepository = manager.getRepository(Subscription);
  const openSubscriptions = await subscriptionsRepository.find({
    where: {
      workspaceId: In(workspaces.map(({ id }) => id)),
      status: In(OPEN_SUBSCRIPTION_STATUSES),
    },
    select: { workspaceId: true },
  });
  const subscribedWorkspaceIds = new Set(
    openSubscriptions.map(({ workspaceId }) => workspaceId),
  );
  const periodStart = new Date();
  const periodEnd = addMonths(periodStart, 1);
  const missingSubscriptions = workspaces
    .filter(({ id }) => !subscribedWorkspaceIds.has(id))
    .map(({ id }) => ({
      workspaceId: id,
      planId: starterPlan.id,
      provider: PaymentProvider.MANUAL,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    }));

  if (missingSubscriptions.length > 0) {
    await subscriptionsRepository
      .createQueryBuilder()
      .insert()
      .values(missingSubscriptions)
      .orIgnore()
      .execute();
  }
}

export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
