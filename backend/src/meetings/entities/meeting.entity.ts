import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Operation } from '../../operations/entities/operation.entity';

@Entity({ name: 'meetings' })
export class Meeting {
  @ApiProperty({
    description: 'The unique identifier for the meeting',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The timestamp when the meeting was held',
    example: '2024-01-15T10:00:00Z',
  })
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @ApiProperty({
    description: 'The status of the meeting',
    example: 'active',
    enum: ['active', 'closed'],
  })
  @Column({ type: 'text', default: 'active' })
  status: string; // 'active', 'closed'

  @ApiProperty({
    description: 'Optional notes for the meeting',
    example: 'Discussion about new loan policies.',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ type: () => [Operation] })
  @OneToMany(() => Operation, (operation) => operation.meeting)
  operations: Operation[];
}
