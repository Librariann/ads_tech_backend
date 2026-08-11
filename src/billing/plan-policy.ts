import {
  BillingInterval,
  EntitlementResource,
  ResetInterval,
} from '../database/entities/enums';

export const STARTER_PLAN_CODE = 'starter';
export const PRO_PLAN_CODE = 'pro';
export const CURRENT_PLAN_VERSION = 1;
export const ENTITLEMENT_APPROACHING_RATIO = 0.8;

export type PlanPolicy = {
  code: string;
  name: string;
  version: number;
  billingInterval: BillingInterval;
  priceAmount: string;
  currency: string;
  entitlements: Record<
    EntitlementResource,
    { limitValue: string; resetInterval: ResetInterval }
  >;
};

export const PLAN_POLICIES: readonly PlanPolicy[] = [
  {
    code: STARTER_PLAN_CODE,
    name: 'Starter',
    version: CURRENT_PLAN_VERSION,
    billingInterval: BillingInterval.MONTH,
    priceAmount: '0',
    currency: 'KRW',
    entitlements: {
      [EntitlementResource.WORKSPACE_MEMBERS]: {
        limitValue: '2',
        resetInterval: ResetInterval.NONE,
      },
      [EntitlementResource.AD_ACCOUNTS]: {
        limitValue: '2',
        resetInterval: ResetInterval.NONE,
      },
      [EntitlementResource.AI_REQUESTS]: {
        limitValue: '100',
        resetInterval: ResetInterval.BILLING_PERIOD,
      },
      [EntitlementResource.AI_TOKENS]: {
        limitValue: '500000',
        resetInterval: ResetInterval.BILLING_PERIOD,
      },
    },
  },
  {
    code: PRO_PLAN_CODE,
    name: 'Pro',
    version: CURRENT_PLAN_VERSION,
    billingInterval: BillingInterval.MONTH,
    priceAmount: '49000',
    currency: 'KRW',
    entitlements: {
      [EntitlementResource.WORKSPACE_MEMBERS]: {
        limitValue: '10',
        resetInterval: ResetInterval.NONE,
      },
      [EntitlementResource.AD_ACCOUNTS]: {
        limitValue: '10',
        resetInterval: ResetInterval.NONE,
      },
      [EntitlementResource.AI_REQUESTS]: {
        limitValue: '2000',
        resetInterval: ResetInterval.BILLING_PERIOD,
      },
      [EntitlementResource.AI_TOKENS]: {
        limitValue: '5000000',
        resetInterval: ResetInterval.BILLING_PERIOD,
      },
    },
  },
] as const;
