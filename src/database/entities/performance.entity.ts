import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdAccount } from './advertising.entity';
import { Campaign } from './campaign.entity';
import { PlatformCampaignBinding } from './publishing.entity';
import { Workspace } from './workspace.entity';

@Entity({ name: 'daily_performance' })
@Index(['adAccountId', 'externalCampaignId', 'reportDate', 'currency'], {
  unique: true,
})
@Index(['workspaceId', 'reportDate'])
@Index(['workspaceId', 'campaignId', 'reportDate'])
@Index(['adAccountId', 'reportDate'])
export class DailyPerformance {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'ad_account_id', type: 'bigint' })
  adAccountId: string;

  @ManyToOne(() => AdAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_account_id' })
  adAccount: AdAccount;

  @Column({ name: 'campaign_id', type: 'bigint', nullable: true })
  campaignId?: string;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: Campaign;

  @Column({ name: 'platform_binding_id', type: 'bigint', nullable: true })
  platformBindingId?: string;

  @ManyToOne(() => PlatformCampaignBinding, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'platform_binding_id' })
  platformBinding?: PlatformCampaignBinding;

  @Column({ name: 'external_campaign_id' })
  externalCampaignId: string;

  @Column({ name: 'report_date', type: 'date' })
  reportDate: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ type: 'bigint', default: 0 })
  impressions: string;

  @Column({ type: 'bigint', default: 0 })
  clicks: string;

  @Column({ type: 'numeric', precision: 20, scale: 6, default: 0 })
  conversions: string;

  @Column({ type: 'numeric', precision: 20, scale: 6, default: 0 })
  spend: string;

  @Column({
    name: 'conversion_value',
    type: 'numeric',
    precision: 20,
    scale: 6,
    default: 0,
  })
  conversionValue: string;

  @Column({ name: 'source_updated_at', type: 'timestamptz', nullable: true })
  sourceUpdatedAt?: Date;

  @Column({ name: 'synced_at', type: 'timestamptz' })
  syncedAt: Date;
}
