import { DeleteMemberUseCase } from './delete-member.use-case';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';
import { MemberNotFoundException } from '@application/exceptions/member-not-found.exception';

describe('DeleteMemberUseCase', () => {
  let useCase: DeleteMemberUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let findByIdSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let softDeleteSpy: jest.SpyInstance;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    findByIdSpy = jest.spyOn(memberRepository, 'findById');
    saveSpy = jest.spyOn(memberRepository, 'save');
    softDeleteSpy = jest.spyOn(memberRepository, 'softDelete');

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

    findByIdSpy.mockResolvedValue(existingMember);
    saveSpy.mockResolvedValue(existingMember);
    softDeleteSpy.mockResolvedValue(undefined);

    await useCase.execute(deleteDto);

    expect(findByIdSpy).toHaveBeenCalledWith(memberId);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(softDeleteSpy).toHaveBeenCalledWith(memberId);
  });

  it('should throw MemberNotFoundException when member not found', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const deleteDto = {
      memberId,
    };

    findByIdSpy.mockResolvedValue(null);

    await expect(useCase.execute(deleteDto)).rejects.toThrow(
      MemberNotFoundException,
    );
    await expect(useCase.execute(deleteDto)).rejects.toThrow(
      `Member with ID ${memberId} not found`,
    );

    expect(findByIdSpy).toHaveBeenCalledWith(memberId);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(softDeleteSpy).not.toHaveBeenCalled();
  });
});
