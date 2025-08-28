import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { ExchangeItem } from './exchange-item.entity';

@Entity('exchange_transactions')
@Index(['userId', 'status'])
@Index(['exchangeItemId', 'status'])
@Index(['executedAt'])
export class ExchangeTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  @Index()
  exchangeItemId: string;

  @Column('int')
  medalCost: number;

  @Column('int', { default: 1 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
  })
  status: TransactionStatus;

  @Column('text', { nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  executedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => ExchangeItem)
  @JoinColumn({ name: 'exchangeItemId' })
  exchangeItem: ExchangeItem;
}