import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdAccount } from './advertising.entity';
import {
  AdPlatform,
  AssetType,
  BudgetType,
  CampaignLifecycleStatus,
  CampaignObjective,
  CampaignVersionStatus,
  CreativeType,
  TargetRuleOperator,
  TargetRuleType,
  ValidationStatus,
} from './enums';
import { Workspace } from './workspace.entity';

@Entity({ name: 'campaigns' })
@Index(['workspaceId', 'lifecycleStatus'])
export class Campaign {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'enum', enum: CampaignObjective })
  objective: CampaignObjective;

  @Column({
    name: 'lifecycle_status',
    type: 'enum',
    enum: CampaignLifecycleStatus,
    default: CampaignLifecycleStatus.DRAFT,
  })
  lifecycleStatus: CampaignLifecycleStatus;

  @Column({ name: 'current_version_id', type: 'bigint', nullable: true })
  currentVersionId?: string;

  @ManyToOne(() => CampaignVersion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'current_version_id',
    foreignKeyConstraintName: 'FK_b21c79e3aa8531934fee5c73c68',
  })
  currentVersion?: Relation<CampaignVersion>;

  @Column({ name: 'created_by', type: 'bigint' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt?: Date;
}

@Entity({ name: 'campaign_versions' })
@Index(['campaignId', 'versionNo'], { unique: true })
export class CampaignVersion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'campaign_id', type: 'bigint' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'version_no', type: 'integer' })
  versionNo: number;

  @Column({ type: 'enum', enum: CampaignVersionStatus })
  status: CampaignVersionStatus;

  @Column({ name: 'budget_type', type: 'enum', enum: BudgetType })
  budgetType: BudgetType;

  @Column({
    name: 'budget_amount',
    type: 'numeric',
    precision: 20,
    scale: 6,
  })
  budgetAmount: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Column({ name: 'bid_strategy', type: 'jsonb' })
  bidStrategy: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  targeting: Record<string, unknown>;

  @Column({ name: 'landing_url', type: 'text', nullable: true })
  landingUrl?: string;

  @Column({ name: 'platform_overrides', type: 'jsonb' })
  platformOverrides: Record<string, unknown> = {};

  @Column({ name: 'created_by', type: 'bigint' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'campaign_budget_allocations' })
@Index(['campaignVersionId', 'adAccountId'], { unique: true })
export class CampaignBudgetAllocation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'campaign_version_id', type: 'bigint' })
  campaignVersionId: string;

  @ManyToOne(() => CampaignVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_version_id' })
  campaignVersion: CampaignVersion;

  @Column({ name: 'ad_account_id', type: 'bigint' })
  adAccountId: string;

  @ManyToOne(() => AdAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ad_account_id' })
  adAccount: AdAccount;

  @Column({ name: 'budget_type', type: 'enum', enum: BudgetType })
  budgetType: BudgetType;

  @Column({
    name: 'budget_amount',
    type: 'numeric',
    precision: 20,
    scale: 6,
  })
  budgetAmount: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'bid_strategy', type: 'jsonb' })
  bidStrategy: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'campaign_target_rules' })
@Index(['campaignVersionId', 'platform', 'targetType'])
export class CampaignTargetRule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'campaign_version_id', type: 'bigint' })
  campaignVersionId: string;

  @ManyToOne(() => CampaignVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_version_id' })
  campaignVersion: CampaignVersion;

  @Column({ type: 'enum', enum: AdPlatform, nullable: true })
  platform?: AdPlatform;

  @Column({ name: 'target_type', type: 'enum', enum: TargetRuleType })
  targetType: TargetRuleType;

  @Column({ type: 'enum', enum: TargetRuleOperator })
  operator: TargetRuleOperator;

  @Column({ type: 'jsonb' })
  value: Record<string, unknown>;

  @Column({ name: 'platform_value', type: 'jsonb', nullable: true })
  platformValue?: Record<string, unknown>;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'campaign_destinations' })
@Index(['campaignId', 'adAccountId'], { unique: true })
export class CampaignDestination {
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

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'creatives' })
@Index(['campaignVersionId', 'sortOrder'])
export class Creative {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'campaign_version_id', type: 'bigint' })
  campaignVersionId: string;

  @ManyToOne(() => CampaignVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_version_id' })
  campaignVersion: CampaignVersion;

  @Column({ type: 'enum', enum: CreativeType })
  type: CreativeType;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  headline?: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ name: 'call_to_action', nullable: true })
  callToAction?: string;

  @Column({ name: 'destination_url', type: 'text', nullable: true })
  destinationUrl?: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'creative_assets' })
@Index(['checksum'])
export class CreativeAsset {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'creative_id', type: 'bigint' })
  creativeId: string;

  @ManyToOne(() => Creative, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creative_id' })
  creative: Creative;

  @Column({ name: 'asset_type', type: 'enum', enum: AssetType })
  assetType: AssetType;

  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes: string;

  @Column({ type: 'integer', nullable: true })
  width?: number;

  @Column({ type: 'integer', nullable: true })
  height?: number;

  @Column({ length: 128 })
  checksum: string;

  @Column({
    name: 'validation_status',
    type: 'enum',
    enum: ValidationStatus,
    default: ValidationStatus.PENDING,
  })
  validationStatus: ValidationStatus;

  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  validationErrors?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
