import { EntitlementResource } from '../database/entities/enums';
import {
  CURRENT_PLAN_VERSION,
  PLAN_POLICIES,
  PRO_PLAN_CODE,
  STARTER_PLAN_CODE,
} from './plan-policy';

describe('plan policies', () => {
  it('defines versioned Starter and Pro plans with every entitlement', () => {
    expect(PLAN_POLICIES.map(({ code }) => code)).toEqual([
      STARTER_PLAN_CODE,
      PRO_PLAN_CODE,
    ]);

    for (const policy of PLAN_POLICIES) {
      expect(policy.version).toBe(CURRENT_PLAN_VERSION);
      expect(Object.keys(policy.entitlements).sort()).toEqual(
        Object.values(EntitlementResource).sort(),
      );
    }
  });
});
