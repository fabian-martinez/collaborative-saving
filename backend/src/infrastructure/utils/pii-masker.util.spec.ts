/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  maskEmail,
  maskIdentificationNumber,
  maskPhone,
  maskGeneral,
} from './pii-masker.util';

describe('PiiMaskerUtil', () => {
  describe('maskEmail', () => {
    it('should mask standard email preserving first and last username char', () => {
      expect(maskEmail('juan.perez@example.com')).toBe('j***z@example.com');
      expect(maskEmail('fabian@domain.org')).toBe('f***n@domain.org');
    });

    it('should handle short usernames', () => {
      expect(maskEmail('a@example.com')).toBe('*@example.com');
      expect(maskEmail('ab@example.com')).toBe('a*@example.com');
    });

    it('should handle strings without @', () => {
      expect(maskEmail('invalid')).toBe('i***d');
      expect(maskEmail('ab')).toBe('***');
    });

    it('should return empty string for null or empty input', () => {
      expect(maskEmail(null)).toBe('');
      expect(maskEmail(undefined)).toBe('');
      expect(maskEmail('')).toBe('');
    });
  });

  describe('maskIdentificationNumber', () => {
    it('should mask ID numbers showing only last 4 digits', () => {
      expect(maskIdentificationNumber('1234567890')).toBe('******7890');
      expect(maskIdentificationNumber('80123456')).toBe('****3456');
    });

    it('should return **** for 4 or fewer characters', () => {
      expect(maskIdentificationNumber('1234')).toBe('****');
      expect(maskIdentificationNumber('12')).toBe('****');
    });

    it('should handle empty or null values', () => {
      expect(maskIdentificationNumber(null)).toBe('');
      expect(maskIdentificationNumber(undefined)).toBe('');
      expect(maskIdentificationNumber('')).toBe('');
    });
  });

  describe('maskPhone', () => {
    it('should mask phone numbers keeping digits before last 4 replaced with asterisks', () => {
      expect(maskPhone('3001234567')).toBe('******4567');
      expect(maskPhone('+57 300 123 4567')).toBe('+** *** *** 4567');
    });

    it('should return **** for short phone numbers', () => {
      expect(maskPhone('123')).toBe('****');
    });

    it('should handle empty or null values', () => {
      expect(maskPhone(null)).toBe('');
      expect(maskPhone(undefined)).toBe('');
      expect(maskPhone('')).toBe('');
    });
  });

  describe('maskGeneral', () => {
    it('should return [PROTEGIDO] for any valid non-empty string', () => {
      expect(maskGeneral('Calle 123 # 45-67')).toBe('[PROTEGIDO]');
      expect(maskGeneral('María Pérez')).toBe('[PROTEGIDO]');
    });

    it('should handle null or empty values', () => {
      expect(maskGeneral(null)).toBe('');
      expect(maskGeneral(undefined)).toBe('');
      expect(maskGeneral('')).toBe('');
    });
  });
});
