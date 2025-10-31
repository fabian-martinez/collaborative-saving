import { GetMembersQueryHandler } from './get-members.query-handler';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';

describe('GetMembersQueryHandler', () => {
  let queryHandler: GetMembersQueryHandler;
  let memberRepository: jest.Mocked<MemberRepository>;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    queryHandler = new GetMembersQueryHandler(memberRepository);
  });

  it('should return empty array when no members exist', async () => {
    memberRepository.findActive.mockResolvedValue([]);

    const result = await queryHandler.execute();

    expect(memberRepository.findActive).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('should return list of active members', async () => {
    const member1 = Member.create({
      name: 'Member 1',
      email: 'member1@example.com',
    });
    const member2 = Member.create({
      name: 'Member 2',
      email: 'member2@example.com',
    });

    memberRepository.findActive.mockResolvedValue([member1, member2]);

    const result = await queryHandler.execute();

    expect(memberRepository.findActive).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: member1.id,
      name: member1.name,
      email: member1.email,
      role: member1.role,
      identificationNumber: member1.identificationNumber,
      status: member1.status,
      address: member1.address,
      phone: member1.phone,
      beneficiary: member1.beneficiary,
      registrationDate: member1.registrationDate,
      createdAt: member1.createdAt,
    });
    expect(result[1]).toEqual({
      id: member2.id,
      name: member2.name,
      email: member2.email,
      role: member2.role,
      identificationNumber: member2.identificationNumber,
      status: member2.status,
      address: member2.address,
      phone: member2.phone,
      beneficiary: member2.beneficiary,
      registrationDate: member2.registrationDate,
      createdAt: member2.createdAt,
    });
  });

  it('should map all member fields correctly', async () => {
    const member = Member.create({
      name: 'Complete Member',
      email: 'complete@example.com',
      role: 'admin',
      identificationNumber: '123456789',
      address: '123 Main St',
      phone: '+1234567890',
      beneficiary: 'John Doe',
    });

    memberRepository.findActive.mockResolvedValue([member]);

    const result = await queryHandler.execute();

    expect(result[0]).toMatchObject({
      id: member.id,
      name: 'Complete Member',
      email: 'complete@example.com',
      role: 'admin',
      identificationNumber: '123456789',
      address: '123 Main St',
      phone: '+1234567890',
      beneficiary: 'John Doe',
      status: 'active',
    });
    expect(result[0].registrationDate).toBeInstanceOf(Date);
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});
