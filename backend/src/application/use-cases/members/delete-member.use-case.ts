import { DeleteMemberDto } from '@application/dto/members/delete-member.dto';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';

export class DeleteMemberUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(dto: DeleteMemberDto): Promise<void> {
    const member = await this.memberRepository.findById(dto.memberId);
    if (!member) {
      // Check if exists but is already soft-deleted
      const repoWithDeleted = this.memberRepository as TypeOrmMemberRepository;
      if (repoWithDeleted.findByIdWithDeleted) {
        const deleted = await repoWithDeleted.findByIdWithDeleted(dto.memberId);
        if (!deleted) throw new Error('Member not found');
        // Already deleted - return null so controller can return 404
        throw new Error('Member not found');
      }
      throw new Error('Member not found');
    }

    // Mark as deleted and update status in DB, then soft delete
    member.markAsDeleted();

    // Update status directly (more efficient than full save)
    const repoImpl = this.memberRepository as TypeOrmMemberRepository;
    if (repoImpl.updateStatus) {
      await repoImpl.updateStatus(dto.memberId, 'inactive');
    }

    // Then soft delete
    await this.memberRepository.softDelete(dto.memberId);
  }
}
