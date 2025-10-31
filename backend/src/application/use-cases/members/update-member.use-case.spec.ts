import { UpdateMemberUseCase } from './update-member.use-case';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';
import { UpdateMemberDto } from '@application/dto/members/update-member.dto';

describe('UpdateMemberUseCase', () => {
  let useCase: UpdateMemberUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    useCase = new UpdateMemberUseCase(memberRepository);
  });

  it('should update member successfully', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'Original Name',
      email: 'original@example.com',
      status: 'active',
      role: 'member',
      address: 'Original Address',
      registrationDate: new Date(),
    });

    const updateDto = {
      memberId,
      name: 'Updated Name',
    };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.save.mockResolvedValue(existingMember);

    const result = await useCase.execute(updateDto);

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Updated Name');
  });

  it('should throw error when member not found', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const updateDto = {
      memberId,
      name: 'Updated Name',
    };

    memberRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(updateDto)).rejects.toThrow(
      'Member not found',
    );

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should update multiple fields', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'Original',
      email: 'original@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    const updateDto = {
      memberId,
      name: 'Updated Name',
      email: 'updated@example.com',
      address: 'Updated Address',
      phone: '+1234567890',
    };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.save.mockResolvedValue(existingMember);

    const result = await useCase.execute(updateDto);

    expect(result.name).toBe('Updated Name');
    expect(result.email).toBe('updated@example.com');
    expect(result.address).toBe('Updated Address');
    expect(result.phone).toBe('+1234567890');
  });

  it('should update only provided fields', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'Original Name',
      email: 'original@example.com',
      status: 'active',
      role: 'member',
      address: 'Original Address',
      registrationDate: new Date(),
    });

    const updateDto = {
      memberId,
      name: 'Updated Name',
    };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.save.mockResolvedValue(existingMember);

    const result = await useCase.execute(updateDto);

    expect(result.name).toBe('Updated Name');
    expect(result.email).toBe('original@example.com'); // Unchanged
    expect(result.address).toBe('Original Address'); // Unchanged
  });

  it('should update role', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const existingMember = Member.fromPersistence({
      id: memberId,
      name: 'Member',
      email: 'member@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    const updateDto: UpdateMemberDto = {
      memberId,
      role: 'admin',
    };

    memberRepository.findById.mockResolvedValue(existingMember);
    memberRepository.save.mockResolvedValue(existingMember);

    const result = await useCase.execute(updateDto);

    expect(result.role).toBe('admin');
  });
});
