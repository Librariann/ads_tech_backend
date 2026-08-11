import { Repository } from 'typeorm';
import { Subscription } from '../database/entities/billing.entity';
import { SubscriptionStatus } from '../database/entities/enums';
import { ActiveSubscriptionRequiredException } from './entitlement-errors';
import { CurrentSubscriptionService } from './current-subscription.service';

describe('CurrentSubscriptionService', () => {
  const repository = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<Subscription>>;
  let service: CurrentSubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CurrentSubscriptionService(repository);
  });

  it('finds only a currently valid subscription for the workspace', async () => {
    const now = new Date('2026-08-11T00:00:00.000Z');
    const subscription = { id: '300', workspaceId: '100' } as Subscription;
    repository.findOne.mockResolvedValue(subscription);

    await expect(service.findCurrent('100', now)).resolves.toBe(subscription);

    const options = repository.findOne.mock.calls[0][0];
    const where = options.where as Record<string, { value?: unknown }>;
    expect(where.workspaceId).toBe('100');
    expect(where.status.value).toEqual([
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PAST_DUE,
    ]);
    expect(where.currentPeriodStart.value).toBe(now);
    expect(where.currentPeriodEnd.value).toBe(now);
    expect(options.relations).toEqual({ plan: true });
  });

  it('rejects a workspace without a currently valid subscription', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.requireCurrent('100')).rejects.toBeInstanceOf(
      ActiveSubscriptionRequiredException,
    );
  });
});
