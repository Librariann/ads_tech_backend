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
import { Workspace } from './workspace.entity';
import {
  BillingInterval,
  BillingTransactionStatus,
  BillingTransactionType,
  EntitlementResource,
  PaymentProvider,
  ResetInterval,
  SubscriptionStatus,
  UsageResource,
  WebhookEventStatus,
} from './enums';

@Entity({ name: 'plans' })
@Index(['code', 'version'], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 80 })
  name: string;

  @Column({ name: 'billing_interval', type: 'enum', enum: BillingInterval })
  billingInterval: BillingInterval;

  @Column({ name: 'price_amount', type: 'numeric', precision: 20, scale: 6 })
  priceAmount: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'plan_entitlements' })
@Index(['planId', 'resource'], { unique: true })
export class PlanEntitlement {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'plan_id', type: 'bigint' })
  planId: string;

  @ManyToOne(() => Plan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'enum', enum: EntitlementResource })
  resource: EntitlementResource;

  @Column({ name: 'limit_value', type: 'bigint', nullable: true })
  limitValue?: string;

  @Column({
    name: 'reset_interval',
    type: 'enum',
    enum: ResetInterval,
    nullable: true,
  })
  resetInterval?: ResetInterval;
}

@Entity({ name: 'subscriptions' })
@Index(['provider', 'providerSubscriptionId'], { unique: true })
@Index(['workspaceId', 'status'])
@Index('UQ_subscriptions_active_workspace', ['workspaceId'], {
  unique: true,
  where: `"status" IN ('trialing', 'active', 'past_due')`,
})
export class Subscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'plan_id', type: 'bigint' })
  planId: string;

  @ManyToOne(() => Plan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId?: string;

  @Column({ name: 'provider_subscription_id', nullable: true })
  providerSubscriptionId?: string;

  @Column({ type: 'enum', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @Column({ name: 'current_period_start', type: 'timestamptz' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamptz' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

@Entity({ name: 'billing_transactions' })
@Index(['providerTransactionId'], { unique: true })
@Index(['workspaceId', 'occurredAt'])
export class BillingTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'subscription_id', type: 'bigint', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => Subscription, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: Subscription;

  @Column({ type: 'enum', enum: BillingTransactionType })
  type: BillingTransactionType;

  @Column({ type: 'enum', enum: BillingTransactionStatus })
  status: BillingTransactionStatus;

  @Column({ type: 'numeric', precision: 20, scale: 6 })
  amount: string;

  @Column({ type: 'char', length: 3 })
  currency: string;

  @Column({ name: 'provider_transaction_id' })
  providerTransactionId: string;

  @Column({ name: 'related_transaction_id', type: 'bigint', nullable: true })
  relatedTransactionId?: string;

  @ManyToOne(() => BillingTransaction, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'related_transaction_id' })
  relatedTransaction?: BillingTransaction;

  @Column({ name: 'failure_code', nullable: true })
  failureCode?: string;

  @Column({ name: 'failure_message', type: 'text', nullable: true })
  failureMessage?: string;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ type: 'jsonb' })
  metadata: Record<string, unknown> = {};
}

@Entity({ name: 'billing_webhook_events' })
@Index(['provider', 'providerEventId'], { unique: true })
export class BillingWebhookEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ name: 'provider_event_id' })
  providerEventId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'enum', enum: WebhookEventStatus })
  status: WebhookEventStatus;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

@Entity({ name: 'usage_events' })
@Index(['idempotencyKey'], { unique: true })
@Index(['workspaceId', 'resource', 'occurredAt'])
export class UsageEvent {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'workspace_id', type: 'bigint' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'enum', enum: UsageResource })
  resource: UsageResource;

  @Column({ type: 'bigint' })
  quantity: string;

  @Column({ name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({ name: 'reference_type', length: 80 })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId?: string;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;
}
