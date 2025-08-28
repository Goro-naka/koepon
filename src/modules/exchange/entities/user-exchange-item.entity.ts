import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ExchangeItem } from './exchange-item.entity';
import { ExchangeTransaction } from './exchange-transaction.entity';

@Entity('user_exchange_items')
@Index(['userId', 'isActive'])
@Index(['exchangeItemId', 'isActive'])
export class UserExchangeItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  @Index()
  exchangeItemId: string;

  @Column('uuid')
  transactionId: string;

  @CreateDateColumn()
  acquiredAt: Date;

  @Column('timestamp', { nullable: true })
  usedAt?: Date;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => ExchangeItem)
  @JoinColumn({ name: 'exchangeItemId' })
  exchangeItem: ExchangeItem;

  @ManyToOne(() => ExchangeTransaction)
  @JoinColumn({ name: 'transactionId' })
  transaction: ExchangeTransaction;
}