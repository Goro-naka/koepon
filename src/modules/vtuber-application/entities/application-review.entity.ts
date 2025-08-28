import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ReviewStage } from '../enums/review-stage.enum';
import { ReviewStatus } from '../enums/review-status.enum';
import { ReviewDecision } from '../enums/review-decision.enum';
import { VTuberApplication } from './vtuber-application.entity';

@Entity('application_reviews')
@Index(['applicationId', 'reviewStage'])
@Index(['reviewerId', 'status'])
@Index(['deadline'])
export class ApplicationReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  applicationId: string;

  @Column('uuid')
  @Index()
  reviewerId: string;

  @Column({
    type: 'enum',
    enum: ReviewStage,
  })
  reviewStage: ReviewStage;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({
    type: 'enum',
    enum: ReviewDecision,
    default: ReviewDecision.PENDING,
  })
  decision: ReviewDecision;

  // 審査内容
  @Column('text', { nullable: true })
  reviewComments?: string;

  @Column('int', { nullable: true })
  score?: number;

  @Column('jsonb', { nullable: true })
  checklistItems?: Record<string, boolean>;

  // 審査管理
  @CreateDateColumn()
  assignedAt: Date;

  @Column('timestamp', { nullable: true })
  startedAt?: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('timestamp')
  deadline: Date;

  // システム管理
  @UpdateDateColumn()
  updatedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => VTuberApplication, application => application.reviews)
  @JoinColumn({ name: 'applicationId' })
  application: VTuberApplication;
}