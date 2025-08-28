import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ExchangeCategory } from '../enums/exchange-category.enum';

@Entity('exchange_items')
@Index(['vtuberId', 'isActive'])
@Index(['category', 'isActive'])
export class ExchangeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  vtuberId: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ExchangeCategory,
  })
  category: ExchangeCategory;

  @Column('int')
  medalCost: number;

  @Column('int')
  totalStock: number;

  @Column('int')
  dailyLimit: number;

  @Column('int')
  userLimit: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('timestamp')
  startDate: Date;

  @Column('timestamp', { nullable: true })
  endDate?: Date;

  @Column('text', { nullable: true })
  imageUrl?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;

  @Column('int', { default: 0 })
  currentStock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}