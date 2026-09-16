import { Member } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../entities/member.entity';
import { CryptoServicePort } from '@domain/ports/services/crypto-service.port';
import { CryptoService } from '../../services/crypto/crypto.service';

export class MemberMapper {
  static toDomain(
    persistence: MemberEntity,
    cryptoService?: CryptoServicePort,
  ): Member {
    try {
      const crypto = cryptoService ?? CryptoService.getInstance();

      const decryptedEmail =
        crypto.decrypt(persistence.email) ?? persistence.email;
      const decryptedIdNum = persistence.identificationNumber
        ? (crypto.decrypt(persistence.identificationNumber) ??
          persistence.identificationNumber)
        : null;
      const decryptedAddress = persistence.address
        ? (crypto.decrypt(persistence.address) ?? persistence.address)
        : null;
      const decryptedPhone = persistence.phone
        ? (crypto.decrypt(persistence.phone) ?? persistence.phone)
        : null;
      const decryptedBeneficiary = persistence.beneficiary
        ? (crypto.decrypt(persistence.beneficiary) ?? persistence.beneficiary)
        : null;

      return Member.fromPersistence({
        id: persistence.id,
        name: persistence.name,
        email: decryptedEmail,
        role: persistence.role,
        identificationNumber: decryptedIdNum ?? null,
        status: persistence.status,
        address: decryptedAddress ?? null,
        phone: decryptedPhone ?? null,
        beneficiary: decryptedBeneficiary ?? null,
        registrationDate: persistence.registrationDate,
        createdAt: persistence.createdAt,
      });
    } catch (error) {
      throw new Error(
        `Failed to map Member to domain: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static toPersistence(
    domain: Member,
    cryptoService?: CryptoServicePort,
  ): Partial<MemberEntity> {
    const crypto = cryptoService ?? CryptoService.getInstance();

    const emailHash =
      crypto.hashBlindIndex(domain.email.toLowerCase().trim()) ?? undefined;
    const identificationNumberHash = domain.identificationNumber
      ? (crypto.hashBlindIndex(domain.identificationNumber.trim()) ?? null)
      : null;

    const result: Partial<MemberEntity> = {
      id: domain.id,
      name: domain.name,
      email: domain.email,
      emailHash,
      identificationNumberHash,
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
