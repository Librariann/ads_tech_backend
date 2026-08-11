import { Repository } from 'typeorm';
import { AdAccount } from '../database/entities/advertising.entity';
import {
  PlanEntitlement,
  Subscription,
  UsageEvent,
} from '../database/entities/billing.entity';
import {
  EntitlementResource,
  ResetInterval,
  WorkspaceMemberStatus,
} from '../database/entities/enums';
import { WorkspaceMember } from '../database/entities/workspace.entity';
import {
  EntitlementErrorCode,
  EntitlementLimitExceededException,
} from './entitlement-errors';
import { EntitlementService } from './entitlement.service';
import { CurrentSubscriptionService } from './current-subscription.service';

describe('EntitlementService workspace member limits', () => {
  const subscription = {
    id: '300',
    workspaceId: '100',
    planId: '400',
    currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
  } as Subscription;
  const entitlement = {
    id: '500',
    planId: subscription.planId,
    resource: EntitlementResource.WORKSPACE_MEMBERS,
    limitValue: '2',
    resetInterval: ResetInterval.NONE,
  } as PlanEntitlement;
  const currentSubscriptionService = {
    requireCurrent: jest.fn(),
  } as unknown as jest.Mocked<CurrentSubscriptionService>;
  const entitlementsRepository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<PlanEntitlement>>;
  const membersRepository = {
    count: jest.fn(),
  } as unknown as jest.Mocked<Repository<WorkspaceMember>>;
  const adAccountsRepository = {} as Repository<AdAccount>;
  const usageEventsRepository = {} as Repository<UsageEvent>;
  let service: EntitlementService;

  beforeEach(() => {
    jest.clearAllMocks();
    currentSubscriptionService.requireCurrent.mockResolvedValue(subscription);
    entitlementsRepository.findOne.mockResolvedValue(entitlement);
    service = new EntitlementService(
      currentSubscriptionService,
      entitlementsRepository,
      membersRepository,
      adAccountsRepository,
      usageEventsRepository,
    );
  });

  it('allows adding a member when the projected usage equals the limit', async () => {
    membersRepository.count.mockResolvedValue(1);

    await expect(
      service.assertCanConsume('100', EntitlementResource.WORKSPACE_MEMBERS, 1),
    ).resolves.toEqual({
      resource: EntitlementResource.WORKSPACE_MEMBERS,
      currentUsage: 1,
      requestedQuantity: 1,
      projectedUsage: 2,
      limit: 2,
      remaining: 0,
      approaching: true,
      code: EntitlementErrorCode.ENTITLEMENT_LIMIT_APPROACHING,
    });
    expect(membersRepository.count).toHaveBeenCalledWith({
      where: {
        workspaceId: '100',
        status: expect.objectContaining({
          value: [WorkspaceMemberStatus.INVITED, WorkspaceMemberStatus.ACTIVE],
        }),
      },
    });
  });

  it('blocks adding a member when the projected usage exceeds the limit', async () => {
    membersRepository.count.mockResolvedValue(2);

    try {
      await service.assertCanConsume(
        '100',
        EntitlementResource.WORKSPACE_MEMBERS,
        1,
      );
      throw new Error('Expected the entitlement check to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(EntitlementLimitExceededException);
      expect(
        (error as EntitlementLimitExceededException).getResponse(),
      ).toEqual(
        expect.objectContaining({
          code: EntitlementErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
          resource: EntitlementResource.WORKSPACE_MEMBERS,
          currentUsage: 2,
          requestedQuantity: 1,
          limit: 2,
        }),
      );
    }
  });

  it('uses only the requested workspace when calculating member usage', async () => {
    membersRepository.count.mockResolvedValue(0);

    await service.check('999', EntitlementResource.WORKSPACE_MEMBERS);

    expect(currentSubscriptionService.requireCurrent).toHaveBeenCalledWith(
      '999',
      expect.any(Date),
      undefined,
    );
    expect(membersRepository.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ workspaceId: '999' }),
    });
  });
});
