import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Reward } from './reward.entity';
import { DownloadLog } from './download-log.entity';

@Entity('user_rewards')
export class UserReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'reward_id', type: 'uuid' })
  rewardId: string;

  @Column({ name: 'gacha_result_id', type: 'uuid', nullable: true })
  gachaResultId?: string;

  @Column({ name: 'exchange_transaction_id', type: 'uuid', nullable: true })
  exchangeTransactionId?: string;

  @CreateDateColumn({ name: 'acquired_at' })
  acquiredAt: Date;

  @Column({ name: 'first_download_at', type: 'timestamptz', nullable: true })
  firstDownloadAt?: Date;

  @Column({ name: 'last_download_at', type: 'timestamptz', nullable: true })
  lastDownloadAt?: Date;

  @Column({ name: 'download_count', type: 'int', default: 0 })
  downloadCount: number;

  @Column({ name: 'daily_download_count', type: 'int', default: 0 })
  dailyDownloadCount: number;

  @Column({ name: 'last_download_date', type: 'date', nullable: true })
  lastDownloadDate?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Reward, reward => reward.userRewards)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  @OneToMany(() => DownloadLog, downloadLog => downloadLog.userReward)
  downloadLogs: DownloadLog[];
}