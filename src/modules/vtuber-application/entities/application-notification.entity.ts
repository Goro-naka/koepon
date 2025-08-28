import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Entity('application_notifications')
@Index(['applicationId', 'type'])
@Index(['recipientId', 'status'])
@Index(['scheduledAt'])
export class ApplicationNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  applicationId: string;

  @Column('uuid')
  @Index()
  recipientId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  // 通知内容
  @Column({ length: 255 })
  title: string;

  @Column('text')
  message: string;

  @Column('text', { nullable: true })
  actionUrl?: string;

  // 送信管理
  @Column('timestamp', { nullable: true })
  scheduledAt?: Date;

  @Column('timestamp', { nullable: true })
  sentAt?: Date;

  @Column('timestamp', { nullable: true })
  readAt?: Date;

  // システム管理
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}