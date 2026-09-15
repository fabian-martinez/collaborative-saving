/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockType } from './stock-type.entity';

export enum StockBehavior {
  CAPITAL_APPRECIATION = 'CAPITAL_APPRECIATION',
  DIVIDEND_YIELD = 'DIVIDEND_YIELD',
}

@Entity({ name: 'stocks' })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, name: 'name' })
  name?: string;

  // Getter and setter for type to maintain transparent backward compatibility
  get type(): string {
    return this.name || '';
  }
  set type(val: string) {
    this.name = val;
  }

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

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'stock_type_id',
  })
  stock_type_id?: string | null;

  @ManyToOne(() => StockType, { nullable: true })
  @JoinColumn({ name: 'stock_type_id' })
  stock_type?: StockType;

  @CreateDateColumn({ name: 'created_at' })
  created_at?: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deleted_at: Date | null;
}
