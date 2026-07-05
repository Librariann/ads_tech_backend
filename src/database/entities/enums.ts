export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum WorkspaceStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MARKETER = 'marketer',
  VIEWER = 'viewer',
}

export enum WorkspaceMemberStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum CampaignObjective {
  SALES = 'sales',
  LEADS = 'leads',
  TRAFFIC = 'traffic',
  AWARENESS = 'awareness',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export enum EntitlementResource {
  WORKSPACE_MEMBERS = 'workspace_members',
  AD_ACCOUNTS = 'ad_accounts',
  AI_REQUESTS = 'ai_requests',
  AI_TOKENS = 'ai_tokens',
}

export enum ResetInterval {
  MONTH = 'month',
  BILLING_PERIOD = 'billing_period',
  NONE = 'none',
}

export enum PaymentProvider {
  MANUAL = 'manual',
  TOSS_PAYMENTS = 'toss_payments',
  STRIPE = 'stripe',
}

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum BillingTransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum BillingTransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum WebhookEventStatus {
  RECEIVED = 'received',
  PROCESSED = 'processed',
  FAILED = 'failed',
  IGNORED = 'ignored',
}

export enum UsageResource {
  AI_REQUESTS = 'ai_requests',
  AI_INPUT_TOKENS = 'ai_input_tokens',
  AI_OUTPUT_TOKENS = 'ai_output_tokens',
}

export enum AdPlatform {
  GOOGLE_ADS = 'google_ads',
  META_ADS = 'meta_ads',
  NAVER_ADS = 'naver_ads',
}

export enum AdPlatformConnectionStatus {
  ACTIVE = 'active',
  REAUTH_REQUIRED = 'reauth_required',
  REVOKED = 'revoked',
  ERROR = 'error',
}

export enum AdAccountStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  DISCONNECTED = 'disconnected',
}

export enum SyncJobType {
  INITIAL = 'initial',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
  BACKFILL = 'backfill',
}

export enum JobStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  PARTIAL = 'partial',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum CampaignLifecycleStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  PARTIAL = 'partial',
  ERROR = 'error',
}

export enum CampaignVersionStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  APPROVED = 'approved',
  SUPERSEDED = 'superseded',
}

export enum BudgetType {
  DAILY = 'daily',
  LIFETIME = 'lifetime',
}

export enum TargetRuleType {
  LOCATION = 'location',
  AGE = 'age',
  GENDER = 'gender',
  INTEREST = 'interest',
  KEYWORD = 'keyword',
  AUDIENCE = 'audience',
  DEVICE = 'device',
  PLACEMENT = 'placement',
}

export enum TargetRuleOperator {
  INCLUDE = 'include',
  EXCLUDE = 'exclude',
}

export enum CreativeType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  RESPONSIVE = 'responsive',
}

export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  LOGO = 'logo',
}

export enum ValidationStatus {
  PENDING = 'pending',
  VALID = 'valid',
  INVALID = 'invalid',
}

export enum PublishAction {
  CREATE = 'create',
  UPDATE = 'update',
  PAUSE = 'pause',
  RESUME = 'resume',
}

export enum PublishJobStatus {
  AWAITING_APPROVAL = 'awaiting_approval',
  QUEUED = 'queued',
  RUNNING = 'running',
  PARTIAL = 'partial',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum PublishTaskStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum PublishEntityType {
  CAMPAIGN = 'campaign',
  GROUP = 'group',
  CREATIVE = 'creative',
  AD = 'ad',
}

export enum PublishStepStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum OperationAttemptStatus {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export enum NormalizedPlatformStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error',
  UNKNOWN = 'unknown',
}

export enum AiScopeType {
  WORKSPACE = 'workspace',
  AD_ACCOUNT = 'ad_account',
  CAMPAIGN = 'campaign',
}

export enum AiAnalysisStatus {
  QUEUED = 'queued',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  INSUFFICIENT_DATA = 'insufficient_data',
}

export enum RecommendationActionType {
  MAINTAIN = 'maintain',
  PAUSE = 'pause',
  INCREASE_BUDGET = 'increase_budget',
  DECREASE_BUDGET = 'decrease_budget',
  REVIEW_TARGETING = 'review_targeting',
  REVIEW_CREATIVE = 'review_creative',
}

export enum RecommendationConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum RecommendationStatus {
  PROPOSED = 'proposed',
  EXECUTING = 'executing',
  DEFERRED = 'deferred',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed',
}

export enum RecommendationEventType {
  STATUS_CHANGED = 'status_changed',
  NOTE_ADDED = 'note_added',
  CAMPAIGN_JOB_LINKED = 'campaign_job_linked',
}

export enum ReportType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  GENERATING = 'generating',
  READY = 'ready',
  FAILED = 'failed',
}

export enum DeliveryChannel {
  EMAIL = 'email',
}

export enum DeliveryStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum AuditActorType {
  USER = 'user',
  SYSTEM = 'system',
  ADMIN = 'admin',
}
