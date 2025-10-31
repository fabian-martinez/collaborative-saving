import { Email } from './email.value-object';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create Email with valid email format', () => {
      const email = new Email('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for invalid email format - missing @', () => {
      expect(() => new Email('testexample.com')).toThrow(
        'Invalid email format: testexample.com',
      );
    });

    it('should throw error for invalid email format - missing domain', () => {
      expect(() => new Email('test@')).toThrow('Invalid email format: test@');
    });

    it('should throw error for invalid email format - missing TLD', () => {
      expect(() => new Email('test@example')).toThrow(
        'Invalid email format: test@example',
      );
    });

    it('should throw error for invalid email format - spaces', () => {
      expect(() => new Email('test @example.com')).toThrow(
        'Invalid email format: test @example.com',
      );
    });

    it('should accept valid email with subdomain', () => {
      const email = new Email('test@mail.example.com');
      expect(email.value).toBe('test@mail.example.com');
    });

    it('should accept valid email with plus sign', () => {
      const email = new Email('test+tag@example.com');
      expect(email.value).toBe('test+tag@example.com');
    });
  });

  describe('create static method', () => {
    it('should create Email using static factory method', () => {
      const email = Email.create('test@example.com');
      expect(email).toBeInstanceOf(Email);
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error when creating with invalid email', () => {
      expect(() => Email.create('invalid')).toThrow(
        'Invalid email format: invalid',
      );
    });
  });
});
