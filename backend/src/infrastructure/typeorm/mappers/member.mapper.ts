import { Member } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../entities/member.entity';

export class MemberMapper {
  static toDomain(persistence: MemberEntity): Member {
    try {
      return Member.fromPersistence({
        id: persistence.id,
        name: persistence.name,
        email: persistence.email,
        role: persistence.role,
        identificationNumber: persistence.identificationNumber ?? null,
        status: persistence.status,
        address: persistence.address ?? null,
        phone: persistence.phone ?? null,
        beneficiary: persistence.beneficiary ?? null,
        registrationDate: persistence.registrationDate,
        createdAt: persistence.createdAt,
      });
    } catch (error) {
      throw new Error(
        `Failed to map Member to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(domain: Member): Partial<MemberEntity> {
    const result: Partial<MemberEntity> = {
      id: domain.id,
      name: domain.name,
      email: domain.email,
      role: domain.role,
      status: domain.status,
      registrationDate: domain.registrationDate,
      createdAt: domain.createdAt,
    };

    // Handle nullable fields - TypeORM uses null for nullable columns
    // For new entities, always include nullable fields (can be null)
    (result as { identificationNumber?: string | null }).identificationNumber =
      domain.identificationNumber !== undefined
        ? domain.identificationNumber || null
        : null;
    (result as { address?: string | null }).address =
      domain.address !== undefined ? domain.address || null : null;
    (result as { phone?: string | null }).phone =
      domain.phone !== undefined ? domain.phone || null : null;
    (result as { beneficiary?: string | null }).beneficiary =
      domain.beneficiary !== undefined ? domain.beneficiary || null : null;

    return result;
  }
}
