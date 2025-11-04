import { DeleteMemberDto } from '@application/dto/members/delete-member.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';

export class DeleteMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(dto: DeleteMemberDto): Promise<void> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      throw new MemberNotFoundException(dto.memberId);
    }

    // Mark as deleted in domain
    member.markAsDeleted();

    // Save the updated member (status will be updated via save)
    await this.memberRepository.save(member);

    // Then soft delete
    await this.memberRepository.softDelete(dto.memberId);
  }
}
