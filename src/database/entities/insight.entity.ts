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
import { Campaign } from './campaign.entity';
import {
  AiAnalysisStatus,
  AiScopeType,
  RecommendationActionType,
  RecommendationConfidence,
  RecommendationEventType,
  RecommendationStatus,
} from './enums';
import { Workspace } from './workspace.entity';

@Entity({ name: 'ai_analyses' })
@Index(['workspaceId', 'createdAt'])
export class AiAnalysis {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'scope_type', type: 'enum', enum: AiScopeType })
  scopeType: AiScopeType;

  @Column({ name: 'scope_id', type: 'bigint', nullable: true })
  scopeId?: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @Column({ name: 'comparison_start', type: 'date', nullable: true })
  comparisonStart?: string;

  @Column({ name: 'comparison_end', type: 'date', nullable: true })
  comparisonEnd?: string;

  @Column({ name: 'input_metrics', type: 'jsonb' })
  inputMetrics: Record<string, unknown>;

  @Column({ name: 'detected_anomalies', type: 'jsonb' })
  detectedAnomalies: Record<string, unknown>;

  @Column({ name: 'model_provider' })
  modelProvider: string;

  @Column({ name: 'model_name' })
  modelName: string;

  @Column({ name: 'prompt_version' })
  promptVersion: string;

  @Column({ type: 'enum', enum: AiAnalysisStatus })
  status: AiAnalysisStatus;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'jsonb', nullable: true })
  limitations?: Record<string, unknown>;

  @Column({ name: 'input_tokens', type: 'integer', nullable: true })
  inputTokens?: number;

  @Column({ name: 'output_tokens', type: 'integer', nullable: true })
  outputTokens?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'recommendations' })
@Index(['analysisId', 'status'])
export class Recommendation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'analysis_id', type: 'bigint' })
  analysisId: string;

  @ManyToOne(() => AiAnalysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'analysis_id' })
  analysis: AiAnalysis;

  @Column({ name: 'campaign_id', type: 'bigint', nullable: true })
  campaignId?: string;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: Campaign;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: RecommendationActionType,
  })
  actionType: RecommendationActionType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  rationale: string;

  @Column({ type: 'jsonb' })
  evidence: Record<string, unknown>;

  @Column({ type: 'enum', enum: RecommendationConfidence })
  confidence: RecommendationConfidence;

  @Column({
    type: 'enum',
    enum: RecommendationStatus,
    default: RecommendationStatus.PROPOSED,
  })
  status: RecommendationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'recommendation_events' })
@Index(['recommendationId', 'createdAt'])
export class RecommendationEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'recommendation_id', type: 'bigint' })
  recommendationId: string;

  @ManyToOne(() => Recommendation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recommendation_id' })
  recommendation: Recommendation;

  @Column({ name: 'event_type', type: 'enum', enum: RecommendationEventType })
  eventType: RecommendationEventType;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: RecommendationStatus,
    nullable: true,
  })
  fromStatus?: RecommendationStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: RecommendationStatus,
    nullable: true,
  })
  toStatus?: RecommendationStatus;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'actor_user_id', type: 'bigint' })
  actorUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
