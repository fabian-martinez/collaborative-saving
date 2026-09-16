import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { encryptionTransformer } from '../transformers/encryption.transformer';

@Entity({ name: 'members' })
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', transformer: encryptionTransformer })
  email: string;

  @Column({ type: 'text', unique: true, name: 'email_hash', nullable: true })
  emailHash?: string;

  @Column({
    type: 'text',
    name: 'identification_number',
    nullable: true,
    transformer: encryptionTransformer,
  })
  identificationNumber?: string;

  @Column({
    type: 'text',
    unique: true,
    name: 'identification_number_hash',
    nullable: true,
  })
  identificationNumberHash?: string | null;

  @Column({ type: 'text', default: 'member', nullable: false })
  role: string;

  @Column({ type: 'text', default: 'active', nullable: false })
  status: string;

  @Column({ type: 'text', nullable: true, transformer: encryptionTransformer })
  address?: string;

  @Column({ type: 'text', nullable: true, transformer: encryptionTransformer })
  phone?: string;

  @Column({ type: 'text', nullable: true, transformer: encryptionTransformer })
  beneficiary?: string;

  @CreateDateColumn({ type: 'date', name: 'registration_date' })
  registrationDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
