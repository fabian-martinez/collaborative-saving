import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MemberResponseDto } from '@application/dto/members/member-response.dto';

export class GetMembersQueryHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(): Promise<MemberResponseDto[]> {
    const members = await this.memberRepository.findActive();
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      identificationNumber: m.identificationNumber,
      status: m.status,
      address: m.address,
      phone: m.phone,
      beneficiary: m.beneficiary,
      registrationDate: m.registrationDate,
      createdAt: m.createdAt,
    }));
  }
}
