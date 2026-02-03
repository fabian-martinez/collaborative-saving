import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseIdentityService } from './firebase-identity.service';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';

describe('FirebaseIdentityService', () => {
  let service: FirebaseIdentityService;
  let firebaseAdminService: FirebaseAdminService;

  const mockVerifyIdToken = jest.fn();
  const mockAuth = {
    verifyIdToken: mockVerifyIdToken,
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
    firebaseAdminService = module.get<FirebaseAdminService>(FirebaseAdminService);
    
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
      mockVerifyIdToken.mockResolvedValue({ uid: 'usr123', email: 'test@example.com' });
      
      const result = await service.getIdentity('valid-token');
      
      expect(result).toEqual({ email: 'test@example.com' });
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    });
  });
});
