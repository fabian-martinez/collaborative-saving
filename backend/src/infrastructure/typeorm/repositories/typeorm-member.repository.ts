import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member as MemberDomain } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../../../members/entities/member.entity';
import { MemberMapper } from '../mappers/member.mapper';

@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly repo: Repository<MemberEntity>,
  ) {}

  // Additional method to check for deleted members
  async findByIdWithDeleted(id: string): Promise<MemberDomain | null> {
    const m = await this.repo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!m) return null;
    // Only return if not deleted
    if (m.deletedAt) return null;
    return MemberMapper.toDomain(m);
  }

  async findById(id: string): Promise<MemberDomain | null> {
    const m = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!m) return null;
    return MemberMapper.toDomain(m);
  }

  async findActive(): Promise<MemberDomain[]> {
    const members = await this.repo.find({
      where: { deletedAt: IsNull(), status: 'active' },
    });
    return members.map((m) => MemberMapper.toDomain(m));
  }

  async save(member: MemberDomain): Promise<MemberDomain> {
    const persistence = MemberMapper.toPersistence(member);

    // Check if member exists in DB
    const existing = await this.repo.findOne({
      where: { id: member.id },
      withDeleted: true,
    });

    if (existing) {
      // Update existing member
      await this.repo.update(member.id, persistence);
      const updated = await this.repo.findOne({
        where: { id: member.id },
        withDeleted: true,
      });
      if (!updated || updated.deletedAt) {
        throw new Error('Member not found after update');
      }
      return MemberMapper.toDomain(updated);
    } else {
      // Insert new member
      const saved = await this.repo.save(persistence as MemberEntity);
      return MemberMapper.toDomain(saved);
    }
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error('Member not found');
    }
  }

  // Helper method to update status directly
  async updateStatus(id: string, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }
}
