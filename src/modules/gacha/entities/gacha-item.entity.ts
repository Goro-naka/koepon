import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gacha } from './gacha.entity';

@Entity('gacha_items')
export class GachaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gacha_id', type: 'uuid' })
  gachaId: string;

  @Column({ name: 'reward_id', type: 'uuid' })
  rewardId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['common', 'rare', 'epic', 'legendary'],
  })
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Column({ name: 'drop_rate', type: 'decimal', precision: 10, scale: 8 })
  dropRate: number;

  @Column({ name: 'max_count', type: 'integer', nullable: true })
  maxCount?: number;

  @Column({ name: 'current_count', type: 'integer', default: 0 })
  currentCount: number;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @ManyToOne(() => Gacha, (gacha) => gacha.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gacha_id' })
  gacha: Gacha;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}