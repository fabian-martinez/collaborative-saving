import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Stock } from '../../stocks/entities/stock.entity';
import { Member } from '../../members/entities/member.entity';
import { Loan } from '../../loans/entities/loan.entity';

@Entity({ name: 'stock_subscriptions' })
export class StockSubscription {
  @ApiProperty({
    description: 'The unique identifier for the stock subscription',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the member who owns the subscription',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  member_id: string;

  @ApiProperty({
    description: 'The ID of the stock type for the subscription',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  stock_id: string;

  @ApiProperty({
    description: 'The date the subscription was purchased',
    example: '2024-01-20',
  })
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  purchase_date: string;

  @ApiProperty({
    description: 'The status of the subscription',
    example: 'active',
    enum: ['active', 'inactive'],
  })
  @Column({ type: 'text', default: 'active' })
  status: string; // active, inactive, etc.

  @ApiProperty({
    description: 'The number of stock units in this subscription',
    example: 10,
  })
  @Column({ type: 'numeric', precision: 20, scale: 10, default: 1 })
  quantity: number;

  @ApiProperty({
    description: 'The ID of the loan that financed this subscription, if any',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  @Column({ type: 'uuid', name: 'financing_loan_id', nullable: true })
  financing_loan_id: string | null;

  // Relationships
  @ApiProperty({ type: () => Member })
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ApiProperty({ type: () => Stock })
  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @ApiProperty({ type: () => Loan, nullable: true })
  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'financing_loan_id' })
  financing_loan: Loan;
}
