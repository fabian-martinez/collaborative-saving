import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { StockValueHistory } from './stock-value-history.entity';

export enum StockBehavior {
  CAPITAL_APPRECIATION = 'CAPITAL_APPRECIATION',
  DIVIDEND_YIELD = 'DIVIDEND_YIELD',
}

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

  @ApiProperty({
    description: 'Flag to indicate if the stock has a guaranteed yield',
    example: true,
    default: false,
  })
  @Column({ type: 'boolean', default: false, name: 'is_guaranteed' })
  is_guaranteed: boolean;

  @ApiProperty({
    description:
      'The guaranteed yield for the stock, if applicable (e.g., 0.02 for 2%)',
    example: 0.02,
    nullable: true,
  })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    name: 'guaranteed_yield',
  })
  guaranteed_yield: number | null;

  @ApiProperty({
    description:
      'Comportamiento de la acción: apreciación de capital o dividendos',
    enum: StockBehavior,
    default: StockBehavior.CAPITAL_APPRECIATION,
  })
  @Column({ type: 'text', default: StockBehavior.CAPITAL_APPRECIATION })
  behavior: StockBehavior;

  @ApiProperty({ type: () => [StockValueHistory] })
  @OneToMany(() => StockValueHistory, (history) => history.stock)
  value_history: StockValueHistory[];

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'deleted_at',
  })
  deleted_at: Date | null;
}
