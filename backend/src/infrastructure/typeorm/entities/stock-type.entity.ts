import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockBehavior } from '../enums/stock-behavior.enum';

@Entity({ name: 'stock_types' })
export class StockType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({
    type: 'text',
    default: StockBehavior.CAPITAL_APPRECIATION,
  })
  behavior: StockBehavior;
}
