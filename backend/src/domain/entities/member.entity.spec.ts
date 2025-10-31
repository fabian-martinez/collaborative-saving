import { Member } from './member.entity';
import { Email } from '../value-objects/email.value-object';
import { Phone } from '../value-objects/phone.value-object';
import { MemberStatus } from '../value-objects/member-status.value-object';

describe('Member Entity', () => {
  const mockId = '550e8400-e29b-41d4-a716-446655440000';
  const mockDate = new Date('2024-01-15');

  describe('create static method', () => {
    it('should create Member with minimal required fields', () => {
      const member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
      });

      expect(member.id).toBeDefined();
      expect(member.name).toBe('Test Member');
      expect(member.email).toBe('test@example.com');
      expect(member.status).toBe('active');
      expect(member.role).toBe('member');
      expect(member.registrationDate).toBeInstanceOf(Date);
      expect(member.createdAt).toBeInstanceOf(Date);
    });

    it('should create Member with all fields', () => {
      const member = Member.create({
        name: 'Complete Member',
        email: 'complete@example.com',
        role: 'admin',
        identificationNumber: '123456789',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'John Doe',
      });

      expect(member.name).toBe('Complete Member');
      expect(member.email).toBe('complete@example.com');
      expect(member.role).toBe('admin');
      expect(member.identificationNumber).toBe('123456789');
      expect(member.address).toBe('123 Main St');
      expect(member.phone).toBe('+1234567890');
      expect(member.beneficiary).toBe('John Doe');
    });

    it('should default role to "member" when not provided', () => {
      const member = Member.create({
        name: 'Default Role',
        email: 'default@example.com',
      });

      expect(member.role).toBe('member');
    });

    it('should generate unique IDs for each member', () => {
      const member1 = Member.create({
        name: 'Member 1',
        email: 'member1@example.com',
      });
      const member2 = Member.create({
        name: 'Member 2',
        email: 'member2@example.com',
      });

      expect(member1.id).not.toBe(member2.id);
    });

    it('should throw error for invalid email', () => {
      expect(() =>
        Member.create({
          name: 'Test',
          email: 'invalid-email',
        }),
      ).toThrow('Invalid email format: invalid-email');
    });

    it('should throw error for invalid phone format', () => {
      expect(() =>
        Member.create({
          name: 'Test',
          email: 'test@example.com',
          phone: 'invalid',
        }),
      ).toThrow('Invalid phone format: invalid');
    });
  });

  describe('fromPersistence static method', () => {
    it('should create Member from persistence data', () => {
      const member = Member.fromPersistence({
        id: mockId,
        name: 'Persisted Member',
        email: 'persisted@example.com',
        status: 'active',
        role: 'member',
        registrationDate: mockDate,
        createdAt: mockDate,
      });

      expect(member.id).toBe(mockId);
      expect(member.name).toBe('Persisted Member');
      expect(member.email).toBe('persisted@example.com');
      expect(member.status).toBe('active');
      expect(member.role).toBe('member');
    });

    it('should handle string dates', () => {
      const member = Member.fromPersistence({
        id: mockId,
        name: 'String Dates',
        email: 'dates@example.com',
        status: 'active',
        role: 'member',
        registrationDate: '2024-01-15',
        createdAt: '2024-01-15',
      });

      expect(member.registrationDate).toBeInstanceOf(Date);
      expect(member.createdAt).toBeInstanceOf(Date);
    });

    it('should handle nullable optional fields', () => {
      const member = Member.fromPersistence({
        id: mockId,
        name: 'Nullable Fields',
        email: 'nullable@example.com',
        status: 'active',
        role: 'member',
        registrationDate: mockDate,
        identificationNumber: null,
        address: null,
        phone: null,
        beneficiary: null,
      });

      expect(member.identificationNumber).toBeUndefined();
      expect(member.address).toBeUndefined();
      expect(member.phone).toBeUndefined();
      expect(member.beneficiary).toBeUndefined();
    });

    it('should handle optional fields with values', () => {
      const member = Member.fromPersistence({
        id: mockId,
        name: 'With Optional',
        email: 'optional@example.com',
        status: 'active',
        role: 'member',
        registrationDate: mockDate,
        identificationNumber: '123456789',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'John Doe',
      });

      expect(member.identificationNumber).toBe('123456789');
      expect(member.address).toBe('123 Main St');
      expect(member.phone).toBe('+1234567890');
      expect(member.beneficiary).toBe('John Doe');
    });

    it('should default createdAt to current date when not provided', () => {
      const before = new Date();
      const member = Member.fromPersistence({
        id: mockId,
        name: 'No CreatedAt',
        email: 'nocreated@example.com',
        status: 'active',
        role: 'member',
        registrationDate: mockDate,
      });
      const after = new Date();

      expect(member.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(member.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should handle inactive status', () => {
      const member = Member.fromPersistence({
        id: mockId,
        name: 'Inactive',
        email: 'inactive@example.com',
        status: 'inactive',
        role: 'member',
        registrationDate: mockDate,
      });

      expect(member.status).toBe('inactive');
      expect(member.isActive()).toBe(false);
    });
  });

  describe('update method', () => {
    let member: Member;

    beforeEach(() => {
      member = Member.create({
        name: 'Original Name',
        email: 'original@example.com',
        address: 'Original Address',
        phone: '+1111111111',
        beneficiary: 'Original Beneficiary',
        role: 'member',
      });
    });

    it('should update name', () => {
      member.update({ name: 'Updated Name' });
      expect(member.name).toBe('Updated Name');
    });

    it('should update email', () => {
      member.update({ email: 'updated@example.com' });
      expect(member.email).toBe('updated@example.com');
    });

    it('should update address', () => {
      member.update({ address: 'Updated Address' });
      expect(member.address).toBe('Updated Address');
    });

    it('should update phone', () => {
      member.update({ phone: '+2222222222' });
      expect(member.phone).toBe('+2222222222');
    });

    it('should not clear phone when undefined is passed (undefined means no update)', () => {
      const originalPhone = member.phone;
      expect(originalPhone).toBe('+1111111111'); // Original value
      member.update({ phone: undefined });
      // When undefined is passed, the field is not updated
      expect(member.phone).toBe(originalPhone);
    });

    it('should update beneficiary', () => {
      member.update({ beneficiary: 'Updated Beneficiary' });
      expect(member.beneficiary).toBe('Updated Beneficiary');
    });

    it('should update role', () => {
      member.update({ role: 'admin' });
      expect(member.role).toBe('admin');
    });

    it('should update identificationNumber', () => {
      member.update({ identificationNumber: '987654321' });
      expect(member.identificationNumber).toBe('987654321');
    });

    it('should update multiple fields at once', () => {
      member.update({
        name: 'Multiple Update',
        email: 'multiple@example.com',
        address: 'New Address',
      });

      expect(member.name).toBe('Multiple Update');
      expect(member.email).toBe('multiple@example.com');
      expect(member.address).toBe('New Address');
    });

    it('should not update fields that are not provided', () => {
      const originalEmail = member.email;
      member.update({ name: 'Only Name' });
      expect(member.email).toBe(originalEmail);
    });

    it('should throw error for invalid email format', () => {
      expect(() => member.update({ email: 'invalid-email' })).toThrow(
        'Invalid email format: invalid-email',
      );
    });

    it('should throw error for invalid phone format', () => {
      expect(() => member.update({ phone: 'invalid' })).toThrow(
        'Invalid phone format: invalid',
      );
    });
  });

  describe('markAsDeleted method', () => {
    it('should mark member as inactive', () => {
      const member = Member.create({
        name: 'To Delete',
        email: 'delete@example.com',
      });

      expect(member.isActive()).toBe(true);
      expect(member.status).toBe('active');

      member.markAsDeleted();

      expect(member.isActive()).toBe(false);
      expect(member.status).toBe('inactive');
    });
  });

  describe('getters', () => {
    let member: Member;

    beforeEach(() => {
      member = Member.create({
        name: 'Test Member',
        email: 'test@example.com',
        identificationNumber: '123456789',
        address: '123 Main St',
        phone: '+1234567890',
        beneficiary: 'John Doe',
        role: 'admin',
      });
    });

    it('should return name via getter', () => {
      expect(member.name).toBe('Test Member');
    });

    it('should return email via getter', () => {
      expect(member.email).toBe('test@example.com');
    });

    it('should return status via getter', () => {
      expect(member.status).toBe('active');
    });

    it('should return role via getter', () => {
      expect(member.role).toBe('admin');
    });

    it('should return identificationNumber via getter', () => {
      expect(member.identificationNumber).toBe('123456789');
    });

    it('should return address via getter', () => {
      expect(member.address).toBe('123 Main St');
    });

    it('should return phone via getter', () => {
      expect(member.phone).toBe('+1234567890');
    });

    it('should return beneficiary via getter', () => {
      expect(member.beneficiary).toBe('John Doe');
    });
  });

  describe('isActive method', () => {
    it('should return true for active member', () => {
      const member = Member.create({
        name: 'Active',
        email: 'active@example.com',
      });
      expect(member.isActive()).toBe(true);
    });

    it('should return false for inactive member', () => {
      const member = Member.create({
        name: 'Inactive',
        email: 'inactive@example.com',
      });
      member.markAsDeleted();
      expect(member.isActive()).toBe(false);
    });
  });
});
