import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('vtuber_dashboards')
@Index(['vtuberId', 'periodStart', 'periodEnd'])
export class VTuberDashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  vtuberId: string;

  @Column('timestamp')
  periodStart: Date;

  @Column('timestamp')
  periodEnd: Date;

  // 収益データ
  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  gachaRevenue: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  medalRevenue: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  revenueGrowth: number;

  // エンゲージメント
  @Column('int', { default: 0 })
  totalFans: number;

  @Column('int', { default: 0 })
  activeFans: number;

  @Column('int', { default: 0 })
  newFans: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  fanGrowthRate: number;

  // ガチャ統計
  @Column('int', { default: 0 })
  gachaPlays: number;

  @Column('int', { default: 0 })
  uniqueGachaUsers: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  averageGachaSpend: number;

  // 特典統計
  @Column('int', { default: 0 })
  rewardsDistributed: number;

  @Column('int', { default: 0 })
  digitalRewards: number;

  @Column('int', { default: 0 })
  physicalRewards: number;

  // パフォーマンス指標
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  conversionRate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  retentionRate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  churnRate: number;

  // メタデータ
  @Column('timestamp')
  calculatedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdated: Date;
}