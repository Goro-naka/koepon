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
import { GachaItem } from './gacha-item.entity';
import { GachaResult } from './gacha-result.entity';
import { VTuber } from '../../vtuber/entities/vtuber.entity';

@Entity('gacha')
export class Gacha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vtuber_id', type: 'uuid' })
  vtuberId: string;

  @ManyToOne(() => VTuber, (vtuber) => vtuber.gachas)
  @JoinColumn({ name: 'vtuber_id' })
  vtuber: VTuber;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({ name: 'medal_reward', type: 'integer' })
  medalReward: number;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'ended'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'ended';

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({ name: 'max_draws', type: 'integer', nullable: true })
  maxDraws?: number;

  @Column({ name: 'total_draws', type: 'integer', default: 0 })
  totalDraws: number;

  @OneToMany(() => GachaItem, (item) => item.gacha, { cascade: true })
  items: GachaItem[];

  @OneToMany(() => GachaResult, (result) => result.gacha)
  results: GachaResult[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}