import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Stock } from './stock.entity';
import { Operation } from './operation.entity';

@Entity({ name: 'stock_value_history' })
export class StockValueHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'stock_id' })
  stockId: string;

  @Column({ type: 'uuid', name: 'operation_id' })
  operationId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'previous_value' })
  previousValue: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'growth_from_contributions',
  })
  growthFromContributions: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'growth_from_interest',
  })
  growthFromInterest: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'total_growth_per_share',
  })
  totalGrowthPerShare: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'new_value' })
  newValue: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @ManyToOne(() => Operation)
  @JoinColumn({ name: 'operation_id' })
  operation: Operation;
}
