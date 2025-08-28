import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum AdminActionType {
  USER_SUSPEND = 'USER_SUSPEND',
  USER_UNSUSPEND = 'USER_UNSUSPEND',
  USER_DELETE = 'USER_DELETE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  VTUBER_APPROVE = 'VTUBER_APPROVE',
  VTUBER_REJECT = 'VTUBER_REJECT',
  VTUBER_STATUS_CHANGE = 'VTUBER_STATUS_CHANGE',
  GACHA_CREATE = 'GACHA_CREATE',
  GACHA_UPDATE = 'GACHA_UPDATE',
  GACHA_DELETE = 'GACHA_DELETE',
  GACHA_ACTIVATE = 'GACHA_ACTIVATE',
  GACHA_DEACTIVATE = 'GACHA_DEACTIVATE',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  AUDIT_LOG_EXPORT = 'AUDIT_LOG_EXPORT',
  ALERT_ACKNOWLEDGE = 'ALERT_ACKNOWLEDGE'
}

export enum AdminTargetType {
  USER = 'USER',
  VTUBER = 'VTUBER',
  GACHA = 'GACHA',
  REWARD = 'REWARD',
  SYSTEM = 'SYSTEM',
  AUDIT_LOG = 'AUDIT_LOG'
}

export enum AdminActionStatus {
  PENDING = 'PENDING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

@Entity('admin_actions')
@Index(['adminUserId', 'actionType', 'executedAt'])
@Index(['targetType', 'targetId'])
@Index(['status', 'executedAt'])
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  adminUserId: string;

  @Column({
    type: 'enum',
    enum: AdminActionType
  })
  actionType: AdminActionType;

  @Column({
    type: 'enum',
    enum: AdminTargetType
  })
  targetType: AdminTargetType;

  @Column('uuid')
  @Index()
  targetId: string;

  // 操作詳細
  @Column('jsonb', { default: {} })
  actionData: Record<string, any>;

  @Column('jsonb', { nullable: true })
  oldValues: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValues: Record<string, any>;

  // メタデータ
  @Column('varchar', { length: 45 })
  ipAddress: string;

  @Column('text')
  userAgent: string;

  @Column('varchar', { length: 128 })
  sessionId: string;

  // 状態
  @Column({
    type: 'enum',
    enum: AdminActionStatus,
    default: AdminActionStatus.PENDING
  })
  status: AdminActionStatus;

  @Column('timestamp')
  @Index()
  executedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  // 監査
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}