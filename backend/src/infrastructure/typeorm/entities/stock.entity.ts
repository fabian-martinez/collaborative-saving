import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockType } from './stock-type.entity';

@Entity({ name: 'stocks' })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  value: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'monthly_contribution',
    default: 0,
  })
  monthlyContribution: number;

  @Column({ type: 'uuid', name: 'stock_type_id', nullable: true })
  stockTypeId: string | null;

  @ManyToOne(() => StockType, (stockType) => stockType.stocks)
  @JoinColumn({ name: 'stock_type_id' })
  stockType: StockType | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
