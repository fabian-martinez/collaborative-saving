import { GetAuthenticatedUserQuery } from './get-authenticated-user.query';
import { IdentityService } from '@domain/ports/services/identity.service.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';

describe('GetAuthenticatedUserQuery', () => {
  let query: GetAuthenticatedUserQuery;
  let identityService: IdentityService;
  let memberRepository: MemberRepository;

  const mockIdentityService = {
    getIdentity: jest.fn(),
  };

  const mockMemberRepository = {
    findByEmail: jest.fn(),
  };

  beforeEach(() => {
    // Since it's a simple class without nestjs injection in itself (it's injected via useFactory in Module but here we test the class),
    // we can instantiate it directly or use testing module. Using testing module to be consistent.
    // Actually, looking at the class, it's a plain class. But for DI consistency let's use Test.createTestingModule if we were testing the provider.
    // Here we can just test the class logic directly as unit test.

    identityService = mockIdentityService as unknown as IdentityService;
    memberRepository = mockMemberRepository as unknown as MemberRepository;
    query = new GetAuthenticatedUserQuery(identityService, memberRepository);

    jest.clearAllMocks();
  });

  it('should return null if identity not found', async () => {
    mockIdentityService.getIdentity.mockResolvedValue(null);

    const result = await query.execute('token');

    expect(result).toBeNull();
    expect(mockIdentityService.getIdentity).toHaveBeenCalledWith('token');
    expect(mockMemberRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('should return null if member not found for email', async () => {
    mockIdentityService.getIdentity.mockResolvedValue({
      email: 'test@example.com',
    });
    mockMemberRepository.findByEmail.mockResolvedValue(null);

    const result = await query.execute('token');

    expect(result).toBeNull();
    expect(mockIdentityService.getIdentity).toHaveBeenCalledWith('token');
    expect(mockMemberRepository.findByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
  });

  it('should return authenticated user dto when both identity and member exist', async () => {
    mockIdentityService.getIdentity.mockResolvedValue({
      email: 'test@example.com',
    });
    const mockMember = {
      id: 'member-123',
      email: 'test@example.com',
      role: 'ADMIN',
    };
    mockMemberRepository.findByEmail.mockResolvedValue(mockMember);

    const result = await query.execute('token');

    expect(result).toEqual({
      id: 'member-123',
      email: 'test@example.com',
      role: 'ADMIN',
    });
  });
});
