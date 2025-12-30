import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  AfterLoad,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { Meeting } from '../../meetings/entities/meeting.entity';
import { LedgerEntry } from '../../ledger-entries/entities/ledger-entry.entity';
import { OperationType } from '../../domain/enums/operation-type.enum';

@Entity({ name: 'operations' })
export class Operation {
  @ApiProperty({
    description: 'The unique identifier for the operation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The ID of the member performing the operation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid', nullable: true })
  member_id: string;

  @ApiProperty({
    description: 'The ID of the meeting this operation is part of',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @Column({ type: 'uuid' })
  meeting_id: string;

  @ApiProperty({
    description: 'The type of the operation',
    example: 'MONTHLY_PAYMENT',
    enum: OperationType,
  })
  @Column({ type: 'text' })
  type: OperationType;

  @ApiProperty({
    description: 'The timestamp when the operation occurred',
    example: '2024-01-15T10:30:00Z',
  })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @ApiProperty({
    description: 'A description of the operation',
    example: 'Loan payment for member',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string;
  // Relationships
  @ApiProperty({ type: () => Member })
  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @ApiProperty({ type: () => [LedgerEntry] })
  @OneToMany(() => LedgerEntry, (ledgerEntry) => ledgerEntry.operation)
  ledger_entries: LedgerEntry[];

  @ApiProperty({
    description: 'The total debit amount for the operation',
    example: 100.0,
  })
  total_debit: number;

  @ApiProperty({
    description: 'The total credit amount for the operation',
    example: 100.0,
  })
  total_credit: number;

  @AfterLoad()
  calculateTotals() {
    if (this.ledger_entries) {
      this.total_debit = this.ledger_entries
        .filter((e) => e.amount > 0)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      this.total_credit = this.ledger_entries
        .filter((e) => e.amount < 0)
        .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);
    } else {
      this.total_debit = 0;
      this.total_credit = 0;
    }
  }
}
