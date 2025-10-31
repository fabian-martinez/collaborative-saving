import { MemberStatus } from './member-status.value-object';

describe('MemberStatus Value Object', () => {
  describe('static constants', () => {
    it('should have ACTIVE constant', () => {
      expect(MemberStatus.ACTIVE).toBeInstanceOf(MemberStatus);
      expect(MemberStatus.ACTIVE.value).toBe('active');
    });

    it('should have INACTIVE constant', () => {
      expect(MemberStatus.INACTIVE).toBeInstanceOf(MemberStatus);
      expect(MemberStatus.INACTIVE.value).toBe('inactive');
    });

    it('should return same instance for ACTIVE', () => {
      expect(MemberStatus.ACTIVE).toBe(MemberStatus.ACTIVE);
    });

    it('should return same instance for INACTIVE', () => {
      expect(MemberStatus.INACTIVE).toBe(MemberStatus.INACTIVE);
    });
  });

  describe('fromString', () => {
    it('should return ACTIVE for "active" string', () => {
      const status = MemberStatus.fromString('active');
      expect(status).toBe(MemberStatus.ACTIVE);
    });

    it('should return INACTIVE for "inactive" string', () => {
      const status = MemberStatus.fromString('inactive');
      expect(status).toBe(MemberStatus.INACTIVE);
    });

    it('should throw error for invalid status string', () => {
      expect(() => MemberStatus.fromString('invalid')).toThrow(
        'Invalid member status: invalid',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => MemberStatus.fromString('')).toThrow(
        'Invalid member status: ',
      );
    });

    it('should throw error for null-like string', () => {
      expect(() => MemberStatus.fromString('null')).toThrow(
        'Invalid member status: null',
      );
    });
  });

  describe('isActive', () => {
    it('should return true for ACTIVE status', () => {
      expect(MemberStatus.ACTIVE.isActive()).toBe(true);
    });

    it('should return false for INACTIVE status', () => {
      expect(MemberStatus.INACTIVE.isActive()).toBe(false);
    });
  });
});
