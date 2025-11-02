import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mandatory_contributions' })
export class MandatoryContribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true, name: 'asset_type' })
  assetType: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  value: number;
}
