import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gacha } from '../../gacha/entities/gacha.entity';

export type VTuberStatus = 'active' | 'graduated' | 'hiatus' | 'suspended';

@Entity('vtubers')
export class VTuber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'channel_name', type: 'varchar', length: 100 })
  channelName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  bannerUrl?: string;

  @Column({ name: 'youtube_channel_id', type: 'varchar', length: 100, nullable: true })
  youtubeChannelId?: string;

  @Column({ name: 'twitter_handle', type: 'varchar', length: 100, nullable: true })
  twitterHandle?: string;

  @Column({ name: 'subscriber_count', type: 'integer', default: 0 })
  subscriberCount: number;

  @Column({ name: 'monthly_listeners', type: 'integer', default: 0 })
  monthlyListeners: number;

  @Column({ name: 'total_donations', type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalDonations: number;

  @Column({ name: 'debut_date', type: 'date', nullable: true })
  debutDate?: Date;

  @Column({ name: 'graduation_date', type: 'date', nullable: true })
  graduationDate?: Date;

  @Column({ 
    type: 'simple-array',
    nullable: true,
  })
  tags?: string[];

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: VTuberStatus;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Gacha, (gacha) => gacha.vtuber)
  gachas: Gacha[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}