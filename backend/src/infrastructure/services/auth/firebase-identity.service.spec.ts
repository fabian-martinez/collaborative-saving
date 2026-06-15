import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseIdentityService } from './firebase-identity.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';

describe('FirebaseIdentityService', () => {
  let service: FirebaseIdentityService;

  const mockVerifyIdToken = jest.fn();
  const mockCreateUser = jest.fn();
  const mockAuth = {
    verifyIdToken: mockVerifyIdToken,
    createUser: mockCreateUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseIdentityService,
        {
          provide: FirebaseAdminService,
          useValue: {
            auth: mockAuth,
          },
        },
      ],
    }).compile();

    service = module.get<FirebaseIdentityService>(FirebaseIdentityService);

    // Clear mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIdentity', () => {
    it('should return null if token verification fails', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const result = await service.getIdentity('invalid-token');

      expect(result).toBeNull();
      expect(mockVerifyIdToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should return null if payload does not contain email', async () => {
      mockVerifyIdToken.mockResolvedValue({ uid: 'usr123' }); // No email

      const result = await service.getIdentity('valid-token-no-email');

      expect(result).toBeNull();
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-no-email');
    });

    it('should return identity with email if verification succeeds', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'usr123',
        email: 'test@example.com',
      });

      const result = await service.getIdentity('valid-token');

      expect(result).toEqual({ email: 'test@example.com' });
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    });
  });

  describe('createUser', () => {
    it('should create user successfully in Firebase Auth', async () => {
      mockCreateUser.mockResolvedValue({ uid: 'user123' });

      await expect(
        service.createUser('test@example.com', 'Test User'),
      ).resolves.not.toThrow();
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });

    it('should catch and ignore email-already-exists error', async () => {
      const error = { code: 'auth/email-already-exists' };
      mockCreateUser.mockRejectedValue(error);

      await expect(
        service.createUser('existing@example.com', 'Existing User'),
      ).resolves.not.toThrow();
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'existing@example.com',
        displayName: 'Existing User',
      });
    });

    it('should throw other errors', async () => {
      const error = new Error('Some Firebase Error');
      mockCreateUser.mockRejectedValue(error);

      await expect(
        service.createUser('test@example.com', 'Test User'),
      ).rejects.toThrow('Some Firebase Error');
    });
  });
});
