import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum StockBehavior {
  CAPITAL_APPRECIATION = 'CAPITAL_APPRECIATION',
  DIVIDEND_YIELD = 'DIVIDEND_YIELD',
}

@Entity({ name: 'stocks' })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  type: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  value: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    name: 'monthly_contribution',
    default: 0,
  })
  monthly_contribution: number;

  @Column({ type: 'boolean', default: false, name: 'is_guaranteed' })
  is_guaranteed: boolean;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 4,
    nullable: true,
    name: 'guaranteed_yield',
  })
  guaranteed_yield: number | null;

  @Column({
    type: 'text',
    default: StockBehavior.CAPITAL_APPRECIATION,
  })
  behavior: StockBehavior;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
