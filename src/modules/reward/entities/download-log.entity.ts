import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reward } from './reward.entity';
import { UserReward } from './user-reward.entity';

@Entity('download_logs')
export class DownloadLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'reward_id', type: 'uuid' })
  rewardId: string;

  @Column({ name: 'user_reward_id', type: 'uuid' })
  userRewardId: string;

  @Column({ name: 'download_url', type: 'varchar', length: 500 })
  downloadUrl: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500 })
  userAgent: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45 })
  ipAddress: string;

  @CreateDateColumn({ name: 'downloaded_at' })
  downloadedAt: Date;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  @ManyToOne(() => UserReward, userReward => userReward.downloadLogs)
  @JoinColumn({ name: 'user_reward_id' })
  userReward: UserReward;
}