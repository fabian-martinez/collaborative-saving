import { CreateMemberUseCase } from './create-member.use-case';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { Member } from '@domain/entities/member.entity';
import { IdentityService } from '@domain/ports/services/identity.service.port';

describe('CreateMemberUseCase', () => {
  let useCase: CreateMemberUseCase;
  let memberRepository: jest.Mocked<MemberRepository>;
  let identityService: jest.Mocked<IdentityService>;
  let createUserSpy: jest.SpyInstance;

  beforeEach(() => {
    memberRepository = {
      findById: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    identityService = {
      getIdentity: jest.fn(),
      createUser: jest.fn(),
    };

    createUserSpy = jest.spyOn(identityService, 'createUser');

    useCase = new CreateMemberUseCase(memberRepository, identityService);
  });

  it('should create a member successfully', async () => {
    const createDto = {
      name: 'Test Member',
      email: 'test@example.com',
    };

    const savedMember = Member.create({
      name: 'Test Member',
      email: 'test@example.com',
    });

    memberRepository.save.mockResolvedValue(savedMember);
    identityService.createUser.mockResolvedValue(undefined);

    const result = await useCase.execute(createDto);

    expect(memberRepository.save.mock.calls.length).toBe(1);
    expect(memberRepository.save.mock.calls[0][0]).toMatchObject({
      name: 'Test Member',
      email: 'test@example.com',
    });
    expect(createUserSpy).toHaveBeenCalledWith(
      'test@example.com',
      'Test Member',
    );
    expect(result).toEqual({
      id: savedMember.id,
      name: savedMember.name,
      email: savedMember.email,
      role: savedMember.role,
      identificationNumber: savedMember.identificationNumber,
      status: savedMember.status,
      address: savedMember.address,
      phone: savedMember.phone,
      beneficiary: savedMember.beneficiary,
      registrationDate: savedMember.registrationDate,
      createdAt: savedMember.createdAt,
    });
  });

  it('should create a member with all optional fields', async () => {
    const createDto = {
      name: 'Complete Member',
      email: 'complete@example.com',
      role: 'admin' as const,
      identificationNumber: '123456789',
      address: '123 Main St',
      phone: '+1234567890',
      beneficiary: 'John Doe',
    };

    const savedMember = Member.create(createDto);
    memberRepository.save.mockResolvedValue(savedMember);
    identityService.createUser.mockResolvedValue(undefined);

    const result = await useCase.execute(createDto);

    expect(memberRepository.save.mock.calls.length).toBe(1);
    expect(createUserSpy).toHaveBeenCalledWith(
      'complete@example.com',
      'Complete Member',
    );
    expect(result.name).toBe('Complete Member');
    expect(result.email).toBe('complete@example.com');
    expect(result.role).toBe('admin');
    expect(result.identificationNumber).toBe('123456789');
    expect(result.address).toBe('123 Main St');
    expect(result.phone).toBe('+1234567890');
    expect(result.beneficiary).toBe('John Doe');
  });

  it('should set default role to member when not provided', async () => {
    const createDto = {
      name: 'Default Role',
      email: 'default@example.com',
    };

    const savedMember = Member.create(createDto);
    memberRepository.save.mockResolvedValue(savedMember);
    identityService.createUser.mockResolvedValue(undefined);

    const result = await useCase.execute(createDto);

    expect(createUserSpy).toHaveBeenCalledWith(
      'default@example.com',
      'Default Role',
    );
    expect(result.role).toBe('member');
  });

  it('should set status to active by default', async () => {
    const createDto = {
      name: 'Active Member',
      email: 'active@example.com',
    };

    const savedMember = Member.create(createDto);
    memberRepository.save.mockResolvedValue(savedMember);
    identityService.createUser.mockResolvedValue(undefined);

    const result = await useCase.execute(createDto);

    expect(createUserSpy).toHaveBeenCalledWith(
      'active@example.com',
      'Active Member',
    );
    expect(result.status).toBe('active');
  });
});
