import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ReportType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  CUSTOM = 'CUSTOM'
}

export enum PeriodType {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ReportVisibility {
  PRIVATE = 'PRIVATE',
  VTUBER_ONLY = 'VTUBER_ONLY',
  ADMIN_ONLY = 'ADMIN_ONLY',
  SHARED = 'SHARED'
}

@Entity('analytics_reports')
@Index(['vtuberId', 'reportType', 'status'])
@Index(['generatedAt', 'status'])
export class AnalyticsReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReportType
  })
  reportType: ReportType;

  @Column('uuid', { nullable: true })
  @Index()
  vtuberId?: string;

  @Column({
    type: 'enum',
    enum: PeriodType
  })
  periodType: PeriodType;

  @Column('timestamp')
  startDate: Date;

  @Column('timestamp')
  endDate: Date;

  // レポートデータ
  @Column('jsonb')
  reportData: Record<string, any>;

  @Column('jsonb')
  summary: Record<string, any>;

  @Column('text', { array: true, default: [] })
  insights: string[];

  @Column('text', { array: true, default: [] })
  recommendations: string[];

  // ステータス
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING
  })
  status: ReportStatus;

  @Column('uuid')
  generatedBy: string;

  @Column('timestamp', { nullable: true })
  generatedAt?: Date;

  // アクセス制御
  @Column({
    type: 'enum',
    enum: ReportVisibility,
    default: ReportVisibility.PRIVATE
  })
  visibility: ReportVisibility;

  @Column('uuid', { array: true, default: [] })
  sharedWith: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}