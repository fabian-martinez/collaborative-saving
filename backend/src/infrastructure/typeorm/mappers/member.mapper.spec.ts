import { MemberMapper } from './member.mapper';
import { Member } from '@domain/entities/member.entity';
import { Member as MemberEntity } from '../../../members/entities/member.entity';

describe('MemberMapper', () => {
  describe('toDomain', () => {
    it('should map MemberEntity to Domain Member', () => {
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Member',
        email: 'test@example.com',
        role: 'member',
        status: 'active',
        identificationNumber: '123456789',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'John Doe',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null as any,
      };

      const domain = MemberMapper.toDomain(entity);

      expect(domain).toBeInstanceOf(Member);
      expect(domain.id).toBe(entity.id);
      expect(domain.name).toBe(entity.name);
      expect(domain.email).toBe(entity.email);
      expect(domain.role).toBe(entity.role);
      expect(domain.status).toBe(entity.status);
      expect(domain.identificationNumber).toBe(entity.identificationNumber);
      expect(domain.address).toBe(entity.address);
      expect(domain.phone).toBe(entity.phone);
      expect(domain.beneficiary).toBe(entity.beneficiary);
    });

    it('should handle null optional fields', () => {
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Minimal Member',
        email: 'minimal@example.com',
        role: 'member',
        status: 'active',
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null as any,
      };

      const domain = MemberMapper.toDomain(entity);

      expect(domain.identificationNumber).toBeUndefined();
      expect(domain.address).toBeUndefined();
      expect(domain.phone).toBeUndefined();
      expect(domain.beneficiary).toBeUndefined();
    });

    it('should throw error for invalid email in entity', () => {
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Invalid Email',
        email: 'invalid-email',
        role: 'member',
        status: 'active',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      expect(() => MemberMapper.toDomain(entity)).toThrow(
        'Failed to map Member to domain',
      );
    });

    it('should throw error for invalid status in entity', () => {
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Invalid Status',
        email: 'test@example.com',
        role: 'member',
        status: 'invalid-status',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      expect(() => MemberMapper.toDomain(entity)).toThrow(
        'Failed to map Member to domain',
      );
    });

    it('should handle non-Error exceptions in toDomain', () => {
      // This test covers the String(error) branch in the catch block
      // We'll mock Member.fromPersistence to throw a non-Error object
      const entity: MemberEntity = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test',
        email: 'test@example.com',
        role: 'member',
        status: 'active',
        registrationDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        deletedAt: null as any,
        identificationNumber: null as any,
        address: null as any,
        phone: null as any,
        beneficiary: null as any,
      };

      // Spy on Member.fromPersistence and make it throw a string (non-Error)
      const originalFromPersistence = Member.fromPersistence;
      const spyFromPersistence = jest
        .spyOn(Member, 'fromPersistence')
        .mockImplementation(() => {
          throw 'String error instead of Error object';
        });

      try {
        expect(() => MemberMapper.toDomain(entity)).toThrow(
          'Failed to map Member to domain: String error instead of Error object',
        );
      } finally {
        spyFromPersistence.mockRestore();
      }
    });
  });

  describe('toPersistence', () => {
    it('should map Domain Member to MemberEntity', () => {
      const domain = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        role: 'admin',
        identificationNumber: '123456789',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'John Doe',
      });

      const persistence = MemberMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.name).toBe(domain.name);
      expect(persistence.email).toBe(domain.email);
      expect(persistence.role).toBe(domain.role);
      expect(persistence.status).toBe(domain.status);
      expect(persistence.identificationNumber).toBe('123456789');
      expect(persistence.address).toBe('123 Main St');
      expect(persistence.phone).toBe('+1234567890');
      expect(persistence.beneficiary).toBe('John Doe');
      expect(persistence.registrationDate).toBe(domain.registrationDate);
      expect(persistence.createdAt).toBe(domain.createdAt);
    });

    it('should map optional fields as null when undefined', () => {
      const domain = Member.create({
        name: 'Minimal Member',
        email: 'minimal@example.com',
      });

      const persistence = MemberMapper.toPersistence(domain);

      expect(persistence.identificationNumber).toBeNull();
      expect(persistence.address).toBeNull();
      expect(persistence.phone).toBeNull();
      expect(persistence.beneficiary).toBeNull();
    });

    it('should handle empty string optional fields', () => {
      const domain = Member.create({
        name: 'Empty Fields',
        email: 'empty@example.com',
        identificationNumber: '',
        address: '',
        phone: '',
        beneficiary: '',
      });

      const persistence = MemberMapper.toPersistence(domain);

      expect(persistence.identificationNumber).toBeNull();
      expect(persistence.address).toBeNull();
      expect(persistence.phone).toBeNull();
      expect(persistence.beneficiary).toBeNull();
    });

    it('should preserve all required fields', () => {
      const domain = Member.create({
        name: 'Required Only',
        email: 'required@example.com',
      });

      const persistence = MemberMapper.toPersistence(domain);

      expect(persistence.id).toBeDefined();
      expect(persistence.name).toBe('Required Only');
      expect(persistence.email).toBe('required@example.com');
      expect(persistence.role).toBe('member');
      expect(persistence.status).toBe('active');
      expect(persistence.registrationDate).toBeInstanceOf(Date);
      expect(persistence.createdAt).toBeInstanceOf(Date);
    });

    it('should handle phone field with empty string converted to null', () => {
      // Test case where phone is empty string (should be converted to null)
      const domainWithEmptyPhone = Member.create({
        name: 'Empty Phone',
        email: 'emptyphone@example.com',
        phone: '', // Empty string should be converted to null
      });

      const persistence = MemberMapper.toPersistence(domainWithEmptyPhone);

      // Empty string phone should be converted to null
      expect(persistence.phone).toBeNull();
    });

    it('should handle phone field when undefined vs empty string', () => {
      // Test both branches: undefined vs provided
      const domainUndefined = Member.create({
        name: 'No Phone',
        email: 'nophone@example.com',
      });
      // Phone is undefined by default
      const persistenceUndefined = MemberMapper.toPersistence(domainUndefined);
      expect(persistenceUndefined.phone).toBeNull();

      // Test with actual phone value
      const domainWithPhone = Member.create({
        name: 'With Phone',
        email: 'withphone@example.com',
        phone: '+1234567890',
      });
      const persistenceWithPhone = MemberMapper.toPersistence(domainWithPhone);
      expect(persistenceWithPhone.phone).toBe('+1234567890');
    });

    it('should handle phone field when explicitly set to undefined vs when has value', () => {
      // Test the branch where phone !== undefined but has value
      const domain = Member.create({
        name: 'Member',
        email: 'member@example.com',
        phone: '+9876543210',
      });
      const persistence = MemberMapper.toPersistence(domain);
      expect(persistence.phone).toBe('+9876543210');

      // Test when phone is explicitly undefined (should still be null in persistence)
      const domainNoPhone = Member.create({
        name: 'No Phone Member',
        email: 'nophone@example.com',
      });
      // Verify phone is undefined in domain
      expect(domainNoPhone.phone).toBeUndefined();
      const persistenceNoPhone = MemberMapper.toPersistence(domainNoPhone);
      // When undefined, should be null in persistence
      expect(persistenceNoPhone.phone).toBeNull();
    });

    it('should handle all nullable fields branches correctly', () => {
      // Test to ensure all branches of the ternary operators are covered
      // Case 1: identificationNumber is defined with value
      const domainWithValues = Member.create({
        name: 'Full Member',
        email: 'full@example.com',
        identificationNumber: '123456789',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'John Doe',
      });
      const persistenceWithValues = MemberMapper.toPersistence(domainWithValues);
      expect(persistenceWithValues.identificationNumber).toBe('123456789');
      expect(persistenceWithValues.address).toBe('123 Main St');
      expect(persistenceWithValues.phone).toBe('+1234567890');
      expect(persistenceWithValues.beneficiary).toBe('John Doe');

      // Case 2: All fields are undefined
      const domainUndefined = Member.create({
        name: 'Minimal',
        email: 'minimal@example.com',
      });
      const persistenceUndefined = MemberMapper.toPersistence(domainUndefined);
      expect(persistenceUndefined.identificationNumber).toBeNull();
      expect(persistenceUndefined.address).toBeNull();
      expect(persistenceUndefined.phone).toBeNull();
      expect(persistenceUndefined.beneficiary).toBeNull();
    });
  });
});
