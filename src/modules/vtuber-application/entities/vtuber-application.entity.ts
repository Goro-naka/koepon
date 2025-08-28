import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApplicationStatus } from '../enums/application-status.enum';
import { ApplicationReview } from './application-review.entity';

@Entity('vtuber_applications')
@Index(['applicantUserId', 'status'])
@Index(['status', 'submittedAt'])
export class VTuberApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  applicantUserId: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;

  // プロフィール情報
  @Column({ length: 255 })
  channelName: string;

  @Column('text')
  channelDescription: string;

  @Column({ length: 500, nullable: true })
  channelUrl?: string;

  @Column('jsonb', { nullable: true })
  socialLinks?: Record<string, string>;

  // 活動情報
  @Column('text', { array: true, default: '{}' })
  streamingPlatforms: string[];

  @Column('text', { array: true, default: '{}' })
  contentGenres: string[];

  @Column('text', { nullable: true })
  streamingSchedule?: string;

  @Column('int', { nullable: true })
  experienceYears?: number;

  // 申請書類
  @Column('text', { nullable: true })
  identityDocument?: string;

  @Column('text', { nullable: true })
  activityProof?: string;

  @Column('text', { nullable: true })
  businessPlan?: string;

  @Column('text', { array: true, default: '{}' })
  additionalDocuments?: string[];

  // システム管理
  @Column('timestamp', { nullable: true })
  reviewDeadline?: Date;

  @Column('timestamp', { nullable: true })
  approvedAt?: Date;

  @Column('timestamp', { nullable: true })
  rejectedAt?: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => ApplicationReview, review => review.application)
  reviews: ApplicationReview[];
}