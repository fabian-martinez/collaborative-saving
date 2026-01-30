import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AmortizationType {
  FRENCH = 'french',
  GERMAN = 'german',
}

@Entity({ name: 'loan_types' })
export class LoanType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'default_approved_amount',
  })
  defaultApprovedAmount: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    name: 'default_interest_rate',
  })
  defaultInterestRate: number;

  @Column({ type: 'integer', name: 'default_term' })
  defaultTerm: number;

  @Column({
    type: 'text',
    name: 'amortization_type',
    default: AmortizationType.FRENCH,
  })
  amortizationType: AmortizationType;
}
