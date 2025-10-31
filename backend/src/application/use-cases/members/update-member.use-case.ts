import { UpdateMemberDto } from '@application/dto/members/update-member.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';

export class UpdateMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(dto: UpdateMemberDto): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) throw new Error('Member not found');

    member.update({
      name: dto.name,
      email: dto.email,
      role: dto.role,
      identificationNumber: dto.identificationNumber,
      address: dto.address,
      phone: dto.phone,
      beneficiary: dto.beneficiary,
    });

    const updated = await this.memberRepository.save(member);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      identificationNumber: updated.identificationNumber,
      status: updated.status,
      address: updated.address,
      phone: updated.phone,
      beneficiary: updated.beneficiary,
      registrationDate: updated.registrationDate,
      createdAt: updated.createdAt,
    };
  }
}
