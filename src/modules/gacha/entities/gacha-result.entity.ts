import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gacha } from './gacha.entity';
import { GachaItem } from './gacha-item.entity';

@Entity('gacha_results')
export class GachaResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'gacha_id', type: 'uuid' })
  gachaId: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({ name: 'medal_reward', type: 'integer' })
  medalReward: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ManyToOne(() => Gacha, (gacha) => gacha.results)
  @JoinColumn({ name: 'gacha_id' })
  gacha: Gacha;

  @ManyToOne(() => GachaItem)
  @JoinColumn({ name: 'item_id' })
  item: GachaItem;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}