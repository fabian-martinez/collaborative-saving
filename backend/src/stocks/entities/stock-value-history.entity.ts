import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity({ name: 'stock_value_history' })
export class StockValueHistory {
  @ApiProperty({
    description: 'The unique identifier for the history record',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the stock this history record belongs to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  stock_id: string;

  @ApiProperty({
    description: 'The value of the stock at the time',
    example: 105.5,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @ApiProperty({
    description: 'The timestamp when this value was recorded',
    example: '2024-02-01T10:00:00Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  date: Date;

  @ManyToOne(() => Stock, (stock) => stock.value_history)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
