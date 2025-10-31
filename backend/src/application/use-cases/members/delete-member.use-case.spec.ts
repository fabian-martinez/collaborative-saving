import { DeleteMemberUseCase } from './delete-member.use-case';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { TypeOrmMemberRepository } from '@infrastructure/typeorm/repositories/typeorm-member.repository';
import { Member } from '@domain/entities/member.entity';

describe('DeleteMemberUseCase', () => {
  let useCase: DeleteMemberUseCase;
  let memberRepository: jest.Mocked<
    MemberRepository & Partial<TypeOrmMemberRepository>
  >;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      findByIdWithDeleted: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<
      MemberRepository & Partial<TypeOrmMemberRepository>
    >;

    useCase = new DeleteMemberUseCase(memberRepository);
  });

  it('should delete member successfully', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'To Delete',
      email: 'delete@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    const deleteDto = {
      memberId,
    };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.updateStatus = jest
      .fn()
      .mockResolvedValue(undefined) as jest.MockedFunction<
      (id: string, status: string) => Promise<void>
    >;
    memberRepository.softDelete.mockResolvedValue(undefined);

    await useCase.execute(deleteDto);

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepository.updateStatus).toHaveBeenCalledWith(
      memberId,
      'inactive',
    );
    expect(memberRepository.softDelete).toHaveBeenCalledWith(memberId);
  });

  it('should throw error when member not found', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const deleteDto = {
      memberId,
    };

    memberRepository.findById.mockResolvedValue(null);
    memberRepository.findByIdWithDeleted = jest
      .fn()
      .mockResolvedValue(null) as jest.MockedFunction<
      (id: string) => Promise<Member | null>
    >;

    await expect(useCase.execute(deleteDto)).rejects.toThrow(
      'Member not found',
    );

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw error when member is already deleted', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const deleteDto = {
      memberId,
    };

    const deletedMember = Member.fromPersistence({
      id: memberId,
      name: 'Already Deleted',
      email: 'deleted@example.com',
      status: 'inactive',
      role: 'member',
      registrationDate: new Date(),
    });

    memberRepository.findById.mockResolvedValue(null);
    memberRepository.findByIdWithDeleted = jest
      .fn()
      .mockResolvedValue(deletedMember) as jest.MockedFunction<
      (id: string) => Promise<Member | null>
    >;

    await expect(useCase.execute(deleteDto)).rejects.toThrow(
      'Member not found',
    );

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepository.findByIdWithDeleted).toHaveBeenCalledWith(
      memberId,
    );
    expect(memberRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should throw error when member not found and repository does not have findByIdWithDeleted', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const deleteDto = {
      memberId,
    };

    // Create a repository mock without findByIdWithDeleted method
    const repoWithoutDeleted: jest.Mocked<MemberRepository> = {
      findById: jest.fn().mockResolvedValue(null),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    const useCaseWithoutDeleted = new DeleteMemberUseCase(repoWithoutDeleted);

    await expect(useCaseWithoutDeleted.execute(deleteDto)).rejects.toThrow(
      'Member not found',
    );

    expect(repoWithoutDeleted.findById).toHaveBeenCalledWith(memberId);
    expect(repoWithoutDeleted.softDelete).not.toHaveBeenCalled();
  });

  it('should delete member successfully even when updateStatus is not available', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'To Delete',
      email: 'delete@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    const deleteDto = {
      memberId,
    };

    // Create a repository mock without updateStatus method
    const repoWithoutUpdateStatus: jest.Mocked<MemberRepository> = {
      findById: jest.fn().mockResolvedValue(existingMember),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<MemberRepository>;

    const useCaseWithoutUpdateStatus = new DeleteMemberUseCase(
      repoWithoutUpdateStatus,
    );

    await useCaseWithoutUpdateStatus.execute(deleteDto);

    expect(repoWithoutUpdateStatus.findById).toHaveBeenCalledWith(memberId);
    expect(repoWithoutUpdateStatus.softDelete).toHaveBeenCalledWith(memberId);
  });
});
