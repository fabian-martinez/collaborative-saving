import { GetMemberDetailQueryHandler } from './get-member-detail.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

describe('GetMemberDetailQueryHandler', () => {
  let queryHandler: GetMemberDetailQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    queryHandler = new GetMemberDetailQueryHandler(memberRepository);
  });

  it('should return member detail by id', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const member = Member.fromPersistence({
      id: memberId,
      name: 'Test Member',
      email: 'test@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    memberRepository.findById.mockResolvedValue(member);

    const result = await queryHandler.execute(memberId);

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
    expect(result).toEqual({
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
    });
  });

  it('should throw error when member not found', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';

    memberRepository.findById.mockResolvedValue(null);

    await expect(queryHandler.execute(memberId)).rejects.toThrow(
      'Member not found',
    );

    expect(memberRepository.findById).toHaveBeenCalledWith(memberId);
  });

  it('should return member with all optional fields', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const member = Member.fromPersistence({
      id: memberId,
      name: 'Complete Member',
      email: 'complete@example.com',
      status: 'active',
      role: 'admin',
      identificationNumber: '123456789',
      address: '123 Main St',
      phone: '+1234567890',
      beneficiary: 'John Doe',
      registrationDate: new Date(),
    });

    memberRepository.findById.mockResolvedValue(member);

    const result = await queryHandler.execute(memberId);

    expect(result).toMatchObject({
      id: memberId,
      name: 'Complete Member',
      email: 'complete@example.com',
      role: 'admin',
      identificationNumber: '123456789',
      address: '123 Main St',
      phone: '+1234567890',
      beneficiary: 'John Doe',
      status: 'active',
    });
  });

  it('should return member with undefined optional fields', async () => {
    const memberId = '550e8400-e29b-41d4-a716-446655440000';
    const member = Member.fromPersistence({
      id: memberId,
      name: 'Minimal Member',
      email: 'minimal@example.com',
      status: 'active',
      role: 'member',
      registrationDate: new Date(),
    });

    memberRepository.findById.mockResolvedValue(member);

    const result = await queryHandler.execute(memberId);

    expect(result.identificationNumber).toBeUndefined();
    expect(result.address).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.beneficiary).toBeUndefined();
  });
});
