import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';

export class GetMemberDetailQueryHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string): Promise<MemberResponseDto> {
    const member = await this.memberRepository.findById(memberId);
    if (!member) throw new Error('Member not found');
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      identificationNumber: member.identificationNumber,
      status: member.status,
      address: member.address,
      phone: member.phone,
      beneficiary: member.beneficiary,
      registrationDate: member.registrationDate,
      createdAt: member.createdAt,
    };
  }
}
