import { OAuthAccount } from '../../users/entities/oauth-account.entity';
import { User } from '../../users/entities/user.entity';
import { AdAccount, AdPlatformConnection, SyncJob } from './advertising.entity';
import {
  BillingTransaction,
  BillingWebhookEvent,
  Plan,
  PlanEntitlement,
  Subscription,
  UsageEvent,
} from './billing.entity';
import {
  Campaign,
  CampaignBudgetAllocation,
  CampaignDestination,
  CampaignTargetRule,
  CampaignVersion,
  Creative,
  CreativeAsset,
} from './campaign.entity';
import {
  AiAnalysis,
  Recommendation,
  RecommendationEvent,
} from './insight.entity';
import { DailyPerformance } from './performance.entity';
import {
  PlatformOperationAttempt,
  PlatformCampaignBinding,
  PublishJob,
  PublishTask,
  PublishTaskStep,
} from './publishing.entity';
import { AuditLog, Report, ReportDelivery } from './reporting.entity';
import {
  BusinessProfile,
  Workspace,
  WorkspaceMember,
} from './workspace.entity';

export const databaseEntities = [
  User,
  OAuthAccount,
  Workspace,
  WorkspaceMember,
  BusinessProfile,
  Plan,
  PlanEntitlement,
  Subscription,
  BillingTransaction,
  BillingWebhookEvent,
  UsageEvent,
  AdPlatformConnection,
  AdAccount,
  SyncJob,
  Campaign,
  CampaignVersion,
  CampaignBudgetAllocation,
  CampaignTargetRule,
  CampaignDestination,
  Creative,
  CreativeAsset,
  PublishJob,
  PublishTask,
  PublishTaskStep,
  PlatformOperationAttempt,
  PlatformCampaignBinding,
  DailyPerformance,
  AiAnalysis,
  Recommendation,
  RecommendationEvent,
  Report,
  ReportDelivery,
  AuditLog,
];
