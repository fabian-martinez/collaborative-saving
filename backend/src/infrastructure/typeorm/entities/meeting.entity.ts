import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'meetings' })
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  date: Date;

  @Column({ type: 'text', default: 'active' })
  status: string; // 'active', 'closed'

  @Column({ type: 'text', nullable: true })
  notes: string;
}
