import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdAccount } from './advertising.entity';
import { Campaign, CampaignVersion } from './campaign.entity';
import {
  AdPlatform,
  NormalizedPlatformStatus,
  OperationAttemptStatus,
  PublishAction,
  PublishEntityType,
  PublishJobStatus,
  PublishStepStatus,
  PublishTaskStatus,
} from './enums';
import { Workspace } from './workspace.entity';

@Entity({ name: 'publish_jobs' })
@Index(['idempotencyKey'], { unique: true })
@Index(['workspaceId', 'status'])
export class PublishJob {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'campaign_id', type: 'bigint' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'campaign_version_id', type: 'bigint' })
  campaignVersionId: string;

  @ManyToOne(() => CampaignVersion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'campaign_version_id' })
  campaignVersion: CampaignVersion;

  @Column({ type: 'enum', enum: PublishAction })
  action: PublishAction;

  @Column({ type: 'enum', enum: PublishJobStatus })
  status: PublishJobStatus;

  @Column({ name: 'preview_snapshot', type: 'jsonb' })
  previewSnapshot: Record<string, unknown>;

  @Column({ name: 'preview_hash', length: 128 })
  previewHash: string;

  @Column({ name: 'requested_by', type: 'bigint' })
  requestedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by' })
  requestedBy: User;

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'idempotency_key' })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;
}

@Entity({ name: 'publish_tasks' })
@Index(['publishJobId', 'adAccountId'], { unique: true })
@Index(['adAccountId', 'status'])
export class PublishTask {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'publish_job_id', type: 'bigint' })
  publishJobId: string;

  @ManyToOne(() => PublishJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publish_job_id' })
  publishJob: PublishJob;

  @Column({ name: 'ad_account_id', type: 'bigint' })
  adAccountId: string;

  @ManyToOne(() => AdAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ad_account_id' })
  adAccount: AdAccount;

  @Column({ type: 'enum', enum: AdPlatform })
  platform: AdPlatform;

  @Column({ type: 'enum', enum: PublishTaskStatus })
  status: PublishTaskStatus;

  @Column({ name: 'request_payload', type: 'jsonb' })
  requestPayload: Record<string, unknown>;

  @Column({ name: 'response_snapshot', type: 'jsonb', nullable: true })
  responseSnapshot?: Record<string, unknown>;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'external_request_id', nullable: true })
  externalRequestId?: string;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;
}

@Entity({ name: 'publish_task_steps' })
@Index(['publishTaskId', 'stepOrder'], { unique: true })
export class PublishTaskStep {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'publish_task_id', type: 'bigint' })
  publishTaskId: string;

  @ManyToOne(() => PublishTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publish_task_id' })
  publishTask: PublishTask;

  @Column({ name: 'step_order', type: 'integer' })
  stepOrder: number;

  @Column({ name: 'entity_type', type: 'enum', enum: PublishEntityType })
  entityType: PublishEntityType;

  @Column({ type: 'enum', enum: PublishAction })
  operation: PublishAction;

  @Column({ name: 'local_entity_id', type: 'bigint', nullable: true })
  localEntityId?: string;

  @Column({ name: 'external_entity_id', nullable: true })
  externalEntityId?: string;

  @Column({ type: 'enum', enum: PublishStepStatus })
  status: PublishStepStatus;

  @Column({ name: 'request_payload', type: 'jsonb' })
  requestPayload: Record<string, unknown>;

  @Column({ name: 'response_snapshot', type: 'jsonb', nullable: true })
  responseSnapshot?: Record<string, unknown>;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;
}

@Entity({ name: 'platform_operation_attempts' })
@Index(['publishTaskStepId', 'attemptNo'], { unique: true })
export class PlatformOperationAttempt {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'publish_task_step_id', type: 'bigint' })
  publishTaskStepId: string;

  @ManyToOne(() => PublishTaskStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publish_task_step_id' })
  publishTaskStep: PublishTaskStep;

  @Column({ name: 'attempt_no', type: 'integer' })
  attemptNo: number;

  @Column({ type: 'enum', enum: OperationAttemptStatus })
  status: OperationAttemptStatus;

  @Column({ name: 'request_snapshot', type: 'jsonb' })
  requestSnapshot: Record<string, unknown>;

  @Column({ name: 'response_snapshot', type: 'jsonb', nullable: true })
  responseSnapshot?: Record<string, unknown>;

  @Column({ name: 'external_request_id', nullable: true })
  externalRequestId?: string;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;
}

@Entity({ name: 'platform_campaign_bindings' })
@Index(['adAccountId', 'externalCampaignId'], { unique: true })
@Index(['campaignId', 'adAccountId'], { unique: true })
export class PlatformCampaignBinding {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'campaign_id', type: 'bigint' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'ad_account_id', type: 'bigint' })
  adAccountId: string;

  @ManyToOne(() => AdAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_account_id' })
  adAccount: AdAccount;

  @Column({ type: 'enum', enum: AdPlatform })
  platform: AdPlatform;

  @Column({ name: 'external_campaign_id' })
  externalCampaignId: string;

  @Column({ name: 'external_group_ids', type: 'jsonb', nullable: true })
  externalGroupIds?: Record<string, unknown>;

  @Column({ name: 'external_ad_ids', type: 'jsonb', nullable: true })
  externalAdIds?: Record<string, unknown>;

  @Column({ name: 'remote_status' })
  remoteStatus: string;

  @Column({
    name: 'normalized_status',
    type: 'enum',
    enum: NormalizedPlatformStatus,
  })
  normalizedStatus: NormalizedPlatformStatus;

  @Column({ name: 'last_applied_version_id', type: 'bigint' })
  lastAppliedVersionId: string;

  @ManyToOne(() => CampaignVersion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'last_applied_version_id' })
  lastAppliedVersion: CampaignVersion;

  @Column({ name: 'last_remote_snapshot', type: 'jsonb', nullable: true })
  lastRemoteSnapshot?: Record<string, unknown>;

  @Column({ name: 'last_synced_at', type: 'timestamptz' })
  lastSyncedAt: Date;
}
