import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from './workspace.entity';
import {
  AdAccountStatus,
  AdPlatform,
  AdPlatformConnectionStatus,
  JobStatus,
  SyncJobType,
} from './enums';

@Entity({ name: 'ad_platform_connections' })
@Index(['workspaceId', 'platform'])
export class AdPlatformConnection {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'enum', enum: AdPlatform })
  platform: AdPlatform;

  @Column({ name: 'external_user_id', nullable: true })
  externalUserId?: string;

  @Column({ type: 'enum', enum: AdPlatformConnectionStatus })
  status: AdPlatformConnectionStatus;

  @Column({ name: 'access_token_ciphertext', type: 'text', select: false })
  accessTokenCiphertext: string;

  @Column({
    name: 'refresh_token_ciphertext',
    type: 'text',
    nullable: true,
    select: false,
  })
  refreshTokenCiphertext?: string;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'text', array: true })
  scopes: string[] = [];

  @Column({ name: 'last_error_code', nullable: true })
  lastErrorCode?: string;

  @Column({ name: 'created_by', type: 'bigint' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity({ name: 'ad_accounts' })
@Index(['workspaceId', 'platform', 'externalAccountId'], { unique: true })
@Index(['workspaceId', 'status'])
export class AdAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'connection_id', type: 'bigint' })
  connectionId: string;

  @ManyToOne(() => AdPlatformConnection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id' })
  connection: AdPlatformConnection;

  @Column({ type: 'enum', enum: AdPlatform })
  platform: AdPlatform;

  @Column({ name: 'external_account_id' })
  externalAccountId: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ length: 64 })
  timezone: string;

  @Column({ type: 'enum', enum: AdAccountStatus })
  status: AdAccountStatus;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity({ name: 'sync_jobs' })
@Index(['idempotencyKey'], { unique: true })
@Index(['adAccountId', 'status'])
export class SyncJob {
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

  @Column({ name: 'job_type', type: 'enum', enum: SyncJobType })
  jobType: SyncJobType;

  @Column({ name: 'date_from', type: 'date', nullable: true })
  dateFrom?: string;

  @Column({ name: 'date_to', type: 'date', nullable: true })
  dateTo?: string;

  @Column({ type: 'enum', enum: JobStatus })
  status: JobStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @Column({ name: 'error_detail', type: 'jsonb', nullable: true })
  errorDetail?: Record<string, unknown>;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
