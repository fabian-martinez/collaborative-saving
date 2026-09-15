/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { StockBehavior } from '@domain/enums/stock-behavior.enum';

@Entity({ name: 'stock_types' })
export class StockType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'text' })
  name: string;

  @Column({
    type: 'text',
    default: StockBehavior.CAPITAL_APPRECIATION,
  })
  behavior: StockBehavior;

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

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deleted_at: Date | null;
}
