import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'members' })
export class Member {
  @ApiProperty({
    description: 'The unique identifier for the member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: "The member's full name",
    example: 'Fabian Martinez',
  })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({
    description: "The member's email address",
    example: 'fabian@example.com',
  })
  @Column({ type: 'text', unique: true })
  email: string;

  @ApiProperty({
    description: "The member's identification number",
    example: '123456789',
  })
  @Column({ type: 'text', unique: true, name: 'identification_number' })
  identificationNumber: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
