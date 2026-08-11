import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdAccount } from '../database/entities/advertising.entity';
import {
  Plan,
  PlanEntitlement,
  Subscription,
  UsageEvent,
} from '../database/entities/billing.entity';
import { WorkspaceMember } from '../database/entities/workspace.entity';
import { CurrentSubscriptionService } from './current-subscription.service';
import { EntitlementService } from './entitlement.service';
import { PlanSeedService } from './plan-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      PlanEntitlement,
      Subscription,
      UsageEvent,
      WorkspaceMember,
      AdAccount,
    ]),
  ],
  providers: [PlanSeedService, CurrentSubscriptionService, EntitlementService],
  exports: [CurrentSubscriptionService, EntitlementService],
})
export class BillingModule {}
