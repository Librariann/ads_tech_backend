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
import {
  AuditActorType,
  DeliveryChannel,
  DeliveryStatus,
  ReportStatus,
  ReportType,
} from './enums';
import { Workspace } from './workspace.entity';

@Entity({ name: 'reports' })
@Index(['workspaceId', 'type', 'periodStart', 'periodEnd'], { unique: true })
export class Report {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @Column({ name: 'metrics_snapshot', type: 'jsonb' })
  metricsSnapshot: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'enum', enum: ReportStatus })
  status: ReportStatus;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'report_deliveries' })
@Index(['reportId', 'channel', 'recipient'], { unique: true })
export class ReportDelivery {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'report_id', type: 'bigint' })
  reportId: string;

  @ManyToOne(() => Report, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column({ type: 'enum', enum: DeliveryChannel })
  channel: DeliveryChannel;

  @Column({ length: 320 })
  recipient: string;

  @Column({ type: 'enum', enum: DeliveryStatus })
  status: DeliveryStatus;

  @Column({ name: 'provider_message_id', nullable: true })
  providerMessageId?: string;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'audit_logs' })
@Index(['workspaceId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'actor_user_id', type: 'bigint', nullable: true })
  actorUserId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: User;

  @Column({ name: 'actor_type', type: 'enum', enum: AuditActorType })
  actorType: AuditActorType;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'entity_type', length: 80 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'bigint', nullable: true })
  entityId?: string;

  @Column({ name: 'before_value', type: 'jsonb', nullable: true })
  beforeValue?: Record<string, unknown>;

  @Column({ name: 'after_value', type: 'jsonb', nullable: true })
  afterValue?: Record<string, unknown>;

  @Column({ name: 'request_id', nullable: true })
  requestId?: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
