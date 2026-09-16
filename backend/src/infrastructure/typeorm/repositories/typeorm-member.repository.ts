import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member as MemberDomain } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../entities/member.entity';
import { MemberMapper } from '../mappers/member.mapper';
import { CRYPTO_SERVICE } from '@domain/constants/injection-tokens';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';

@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly repo: Repository<MemberEntity>,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: CryptoServicePort,
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
    return MemberMapper.toDomain(m, this.cryptoService);
  }

  async findById(id: string): Promise<MemberDomain | null> {
    const m = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!m) return null;
    return MemberMapper.toDomain(m, this.cryptoService);
  }

  async findByIds(ids: string[]): Promise<MemberDomain[]> {
    if (!ids.length) return [];

    const members = await this.repo.find({
      where: { id: In(ids), deletedAt: IsNull() },
    });
    return members.map((m) => MemberMapper.toDomain(m, this.cryptoService));
  }

  async findByEmail(email: string): Promise<MemberDomain | null> {
    const emailHash =
      this.cryptoService.hashBlindIndex(email.toLowerCase().trim()) ??
      undefined;
    const m = await this.repo.findOne({
      where: [
        { emailHash, deletedAt: IsNull() },
        { email, deletedAt: IsNull() },
      ],
    });
    if (!m) return null;
    return MemberMapper.toDomain(m, this.cryptoService);
  }

  async findByIdentificationNumber(
    identificationNumber: string,
  ): Promise<MemberDomain | null> {
    const idHash =
      this.cryptoService.hashBlindIndex(identificationNumber.trim()) ??
      undefined;
    const m = await this.repo.findOne({
      where: [
        { identificationNumberHash: idHash, deletedAt: IsNull() },
        { identificationNumber, deletedAt: IsNull() },
      ],
    });
    if (!m) return null;
    return MemberMapper.toDomain(m, this.cryptoService);
  }

  async findActive(): Promise<MemberDomain[]> {
    const members = await this.repo.find({
      where: { deletedAt: IsNull(), status: 'active' },
    });
    return members.map((m) => MemberMapper.toDomain(m, this.cryptoService));
  }

  async save(member: MemberDomain): Promise<MemberDomain> {
    const persistence = MemberMapper.toPersistence(member, this.cryptoService);

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
      return MemberMapper.toDomain(updated, this.cryptoService);
    } else {
      // Insert new member
      const saved = await this.repo.save(persistence as MemberEntity);
      return MemberMapper.toDomain(saved, this.cryptoService);
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
