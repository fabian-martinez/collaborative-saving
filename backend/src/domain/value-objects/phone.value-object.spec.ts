import { Phone } from './phone.value-object';

describe('Phone Value Object', () => {
  describe('constructor', () => {
    it('should create Phone with valid phone number - basic', () => {
      const phone = new Phone('1234567890');
      expect(phone.value).toBe('1234567890');
    });

    it('should create Phone with valid phone number - with plus', () => {
      const phone = new Phone('+1234567890');
      expect(phone.value).toBe('+1234567890');
    });

    it('should create Phone with formatted number - spaces and dashes', () => {
      const phone = new Phone('123-456-7890');
      expect(phone.value).toBe('123-456-7890');
    });

    it('should create Phone with formatted number - parentheses', () => {
      const phone = new Phone('(123) 456-7890');
      expect(phone.value).toBe('(123) 456-7890');
    });

    it('should create Phone with extension - x format', () => {
      const phone = new Phone('123-456-7890 x6373');
      expect(phone.value).toBe('123-456-7890 x6373');
    });

    it('should create Phone with extension - ext format', () => {
      const phone = new Phone('123-456-7890 ext 123');
      expect(phone.value).toBe('123-456-7890 ext 123');
    });

    it('should create Phone with extension - extension format', () => {
      const phone = new Phone('123-456-7890 extension 456');
      expect(phone.value).toBe('123-456-7890 extension 456');
    });

    it('should create Phone with extension - # format', () => {
      const phone = new Phone('123-456-7890 #789');
      expect(phone.value).toBe('123-456-7890 #789');
    });

    it('should throw error for invalid phone - too short', () => {
      expect(() => new Phone('12345')).toThrow('Invalid phone format: 12345');
    });

    it('should throw error for invalid phone - too long', () => {
      expect(() => new Phone('12345678901234567')).toThrow(
        'Invalid phone format: 12345678901234567',
      );
    });

    it('should throw error for invalid phone - contains letters', () => {
      expect(() => new Phone('123-ABC-7890')).toThrow(
        'Invalid phone format: 123-ABC-7890',
      );
    });

    it('should allow empty string (for optional phone)', () => {
      const phone = new Phone('');
      expect(phone.value).toBe('');
    });
  });

  describe('create static method', () => {
    it('should create Phone from valid string', () => {
      const phone = Phone.create('1234567890');
      expect(phone).toBeInstanceOf(Phone);
      expect(phone?.value).toBe('1234567890');
    });

    it('should return undefined for undefined value', () => {
      const phone = Phone.create(undefined);
      expect(phone).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const phone = Phone.create('');
      expect(phone).toBeUndefined();
    });

    it('should throw error for invalid phone format', () => {
      expect(() => Phone.create('invalid')).toThrow(
        'Invalid phone format: invalid',
      );
    });
  });

  describe('formatted getter', () => {
    it('should return cleaned phone number without formatting', () => {
      const phone = new Phone('123-456-7890');
      expect(phone.formatted).toBe('1234567890');
    });

    it('should return cleaned phone number without spaces', () => {
      const phone = new Phone('123 456 7890');
      expect(phone.formatted).toBe('1234567890');
    });

    it('should return cleaned phone number without parentheses', () => {
      const phone = new Phone('(123) 456-7890');
      expect(phone.formatted).toBe('1234567890');
    });

    it('should remove extension from formatted output', () => {
      const phone = new Phone('358-230-9057 x6373');
      expect(phone.formatted).toBe('3582309057');
    });

    it('should remove extension with ext format', () => {
      const phone = new Phone('358-230-9057 ext 123');
      expect(phone.formatted).toBe('3582309057');
    });

    it('should preserve plus sign in formatted output', () => {
      const phone = new Phone('+1-234-567-8901');
      expect(phone.formatted).toBe('+12345678901');
    });
  });
});
