import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Stock } from './stock.entity';
import { Operation } from '../../operations/entities/operation.entity';

@Entity({ name: 'stock_value_history' })
export class StockValueHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stock_id: string;

  @ManyToOne(() => Stock, (stock) => stock.value_history)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({ type: 'uuid' })
  operation_id: string;

  @ManyToOne(() => Operation)
  @JoinColumn({ name: 'operation_id' })
  operation: Operation;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'previous_value' })
  previous_value: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    name: 'growth_from_contributions',
  })
  growth_from_contributions: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    name: 'growth_from_interest',
  })
  growth_from_interest: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    name: 'total_growth_per_share',
  })
  total_growth_per_share: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'new_value' })
  new_value: number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;
}
