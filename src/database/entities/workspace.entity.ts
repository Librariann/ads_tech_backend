import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  CampaignObjective,
  OnboardingStatus,
  WorkspaceMemberStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from './enums';

@Entity({ name: 'workspaces' })
export class Workspace {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, length: 80 })
  slug: string;

  @Column({
    type: 'enum',
    enum: WorkspaceStatus,
    default: WorkspaceStatus.ACTIVE,
  })
  status: WorkspaceStatus;

  @Column({ name: 'default_currency', type: 'char', length: 3 })
  defaultCurrency: string;

  @Column({ length: 64, default: 'Asia/Seoul' })
  timezone: string;

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

@Entity({ name: 'workspace_members' })
@Index(['workspaceId', 'userId'], { unique: true })
@Index(['workspaceId', 'status'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: WorkspaceRole })
  role: WorkspaceRole;

  @Column({
    type: 'enum',
    enum: WorkspaceMemberStatus,
    default: WorkspaceMemberStatus.ACTIVE,
  })
  status: WorkspaceMemberStatus;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'business_profiles' })
export class BusinessProfile {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint', unique: true })
  workspaceId: string;

  @OneToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'business_name', length: 160, nullable: true })
  businessName?: string;

  @Column({ name: 'industry_code', length: 80, nullable: true })
  industryCode?: string;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl?: string;

  @Column({ name: 'product_summary', type: 'text', nullable: true })
  productSummary?: string;

  @Column({ name: 'target_customer', type: 'text', nullable: true })
  targetCustomer?: string;

  @Column({
    name: 'primary_goal',
    type: 'enum',
    enum: CampaignObjective,
    nullable: true,
  })
  primaryGoal?: CampaignObjective;

  @Column({
    name: 'target_cpa',
    type: 'numeric',
    precision: 20,
    scale: 6,
    nullable: true,
  })
  targetCpa?: string;

  @Column({
    name: 'target_roas',
    type: 'numeric',
    precision: 12,
    scale: 6,
    nullable: true,
  })
  targetRoas?: string;

  @Column({
    name: 'onboarding_status',
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.NOT_STARTED,
  })
  onboardingStatus: OnboardingStatus;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
