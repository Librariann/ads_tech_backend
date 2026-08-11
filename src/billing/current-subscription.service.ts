import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  In,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';
import { Subscription } from '../database/entities/billing.entity';
import { SubscriptionStatus } from '../database/entities/enums';
import { ActiveSubscriptionRequiredException } from './entitlement-errors';

const VALID_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

@Injectable()
export class CurrentSubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}

  async findCurrent(
    workspaceId: string,
    now = new Date(),
    manager?: EntityManager,
  ) {
    const repository = manager
      ? manager.getRepository(Subscription)
      : this.subscriptionsRepository;

    return repository.findOne({
      where: {
        workspaceId,
        status: In(VALID_SUBSCRIPTION_STATUSES),
        currentPeriodStart: LessThanOrEqual(now),
        currentPeriodEnd: MoreThan(now),
      },
      relations: { plan: true },
      order: { createdAt: 'DESC' },
    });
  }

  async requireCurrent(
    workspaceId: string,
    now = new Date(),
    manager?: EntityManager,
  ) {
    const subscription = await this.findCurrent(workspaceId, now, manager);

    if (!subscription) {
      throw new ActiveSubscriptionRequiredException();
    }

    return subscription;
  }
}
