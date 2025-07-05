import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { StockValueHistory } from './stock-value-history.entity';

@Entity({ name: 'stocks' })
export class Stock {
  @ApiProperty({
    description: 'The unique identifier for the stock type',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The type or name of the stock',
    example: 'preferential',
  })
  @Column({ type: 'text', unique: true })
  type: string;

  @ApiProperty({
    description: 'The current value of one stock unit',
    example: 110.0,
  })
  @Column({ type: 'numeric' })
  value: number;

  @ApiProperty({
    description: 'The mandatory monthly contribution for this stock type',
    example: 50.0,
  })
  @Column({ type: 'numeric' })
  monthly_contribution: number;

  @ApiProperty({ type: () => [StockValueHistory] })
  @OneToMany(() => StockValueHistory, (history) => history.stock)
  value_history: StockValueHistory[];
}
