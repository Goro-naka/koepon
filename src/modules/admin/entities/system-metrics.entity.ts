import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum SystemMetricType {
  CPU_USAGE = 'CPU_USAGE',
  MEMORY_USAGE = 'MEMORY_USAGE',
  DISK_USAGE = 'DISK_USAGE',
  NETWORK_THROUGHPUT = 'NETWORK_THROUGHPUT',
  RESPONSE_TIME = 'RESPONSE_TIME',
  ERROR_RATE = 'ERROR_RATE',
  ACTIVE_USERS = 'ACTIVE_USERS',
  CONCURRENT_SESSIONS = 'CONCURRENT_SESSIONS',
  DATABASE_CONNECTIONS = 'DATABASE_CONNECTIONS',
  QUEUE_LENGTH = 'QUEUE_LENGTH'
}

export enum MetricStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

@Entity('system_metrics')
@Index(['metricType', 'collectedAt'])
@Index(['status', 'collectedAt'])
@Index(['source', 'collectedAt'])
export class SystemMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SystemMetricType
  })
  metricType: SystemMetricType;

  @Column('varchar', { length: 100 })
  metricName: string;

  // 値
  @Column('decimal', { precision: 15, scale: 4 })
  value: number;

  @Column('varchar', { length: 20 })
  unit: string;

  @Column('decimal', { precision: 15, scale: 4 })
  threshold: number;

  @Column({
    type: 'enum',
    enum: MetricStatus,
    default: MetricStatus.NORMAL
  })
  status: MetricStatus;

  // メタデータ
  @Column('varchar', { length: 100 })
  source: string;

  @Column('jsonb', { default: {} })
  tags: Record<string, string>;

  // 時刻
  @Column('timestamp')
  @Index()
  collectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}