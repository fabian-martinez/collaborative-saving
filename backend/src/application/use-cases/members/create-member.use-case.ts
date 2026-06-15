import { CreateMemberDto } from '@application/dto/members/create-member.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';
import { Member } from '@domain/entities/member.entity';
import { IdentityService } from '@domain/ports/services/identity.service.port';

export class CreateMemberUseCase {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly identityService: IdentityService,
  ) {}

  async execute(dto: CreateMemberDto): Promise<MemberResponseDto> {
    const member = Member.create({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      identificationNumber: dto.identificationNumber,
      address: dto.address,
      phone: dto.phone,
      beneficiary: dto.beneficiary,
    });

    const saved = await this.memberRepository.save(member);

    // Crear automáticamente el usuario en Firebase Auth
    await this.identityService.createUser(saved.email, saved.name);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      identificationNumber: saved.identificationNumber,
      status: saved.status,
      address: saved.address,
      phone: saved.phone,
      beneficiary: saved.beneficiary,
      registrationDate: saved.registrationDate,
      createdAt: saved.createdAt,
    };
  }
}
