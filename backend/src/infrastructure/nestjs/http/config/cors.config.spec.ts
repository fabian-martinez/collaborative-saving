/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  originToPattern,
  resolveCorsOrigins,
  shouldEnableSwagger,
  LoggerLike,
} from './cors.config';

describe('cors.config', () => {
  describe('originToPattern', () => {
    it('should return literal origin string when origin contains no wildcard', () => {
      // ARRANGE
      const origin = 'https://collaborative-saving.web.app';

      // ACT
      const result = originToPattern(origin);

      // ASSERT
      expect(result).toBe('https://collaborative-saving.web.app');
    });

    it('should return literal "*" when origin is standalone wildcard', () => {
      // ARRANGE
      const origin = '*';

      // ACT
      const result = originToPattern(origin);

      // ASSERT
      expect(result).toBe('*');
    });

    it('should convert origin with wildcard into RegExp matching Firebase preview URLs', () => {
      // ARRANGE
      const pattern = 'https://mobile-collaborative-saving--*.web.app';

      // ACT
      const result = originToPattern(pattern);

      // ASSERT
      expect(result).toBeInstanceOf(RegExp);
      const regex = result as RegExp;

      // Positive matches
      expect(
        regex.test(
          'https://mobile-collaborative-saving--pr268-feat-issue-176-upda-bnlymtx6.web.app',
        ),
      ).toBe(true);
      expect(
        regex.test('https://mobile-collaborative-saving--pr123.web.app'),
      ).toBe(true);

      // Case insensitivity
      expect(
        regex.test('https://MOBILE-COLLABORATIVE-SAVING--PR268.WEB.APP'),
      ).toBe(true);

      // Negative matches (unauthorized domains or protocols)
      expect(regex.test('https://attacker.com')).toBe(false);
      expect(regex.test('https://other-app.web.app')).toBe(false);
      expect(
        regex.test('http://mobile-collaborative-saving--pr123.web.app'),
      ).toBe(false);
      expect(
        regex.test(
          'https://mobile-collaborative-saving--pr123.web.app.attacker.com',
        ),
      ).toBe(false);
      expect(
        regex.test('https://mobile-collaborative-saving--evil/path.web.app'),
      ).toBe(false);
    });

    it('should support general wildcard patterns like https://*.web.app', () => {
      // ARRANGE
      const pattern = 'https://*.web.app';

      // ACT
      const result = originToPattern(pattern);

      // ASSERT
      expect(result).toBeInstanceOf(RegExp);
      const regex = result as RegExp;
      expect(regex.test('https://collaborative-saving.web.app')).toBe(true);
      expect(
        regex.test('https://mobile-collaborative-saving--pr268.web.app'),
      ).toBe(true);
      expect(regex.test('https://sub.domain.web.app')).toBe(true);
      expect(regex.test('https://malicious.com')).toBe(false);
    });
  });

  describe('resolveCorsOrigins', () => {
    let mockLogger: LoggerLike;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      mockLogger = {
        warn: jest.fn(),
        log: jest.fn(),
      };
      warnSpy = jest.spyOn(mockLogger, 'warn');
    });

    it('should return default origins when allowedOriginsEnv is undefined', () => {
      // ARRANGE
      const env = undefined;

      // ACT
      const result = resolveCorsOrigins(env, false, mockLogger);

      // ASSERT
      expect(result).toEqual([
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:8080',
      ]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should return default origins when allowedOriginsEnv is an empty or whitespace string', () => {
      // ARRANGE
      const env = '   ';

      // ACT
      const result = resolveCorsOrigins(env, false, mockLogger);

      // ASSERT
      expect(result).toEqual([
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:8080',
      ]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should parse, trim whitespace, and filter empty items from comma-separated origins', () => {
      // ARRANGE
      const env = ' https://app.example.com , , http://localhost:5173  , ';

      // ACT
      const result = resolveCorsOrigins(env, false, mockLogger);

      // ASSERT
      expect(result).toEqual([
        'https://app.example.com',
        'http://localhost:5173',
      ]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should allow wildcard origin in non-production environments', () => {
      // ARRANGE
      const env = '*';
      const isProduction = false;

      // ACT
      const result = resolveCorsOrigins(env, isProduction, mockLogger);

      // ASSERT
      expect(result).toEqual(['*']);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should default isProduction to false when not provided', () => {
      // ARRANGE
      const env = '*';

      // ACT
      const result = resolveCorsOrigins(env);

      // ASSERT
      expect(result).toEqual(['*']);
    });

    it('should remove wildcard origin and log a warning in production environment', () => {
      // ARRANGE
      const env = 'https://app.example.com, *, https://admin.example.com';
      const isProduction = true;

      // ACT
      const result = resolveCorsOrigins(env, isProduction, mockLogger);

      // ASSERT
      expect(result).toEqual([
        'https://app.example.com',
        'https://admin.example.com',
      ]);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        'Wildcard "*" origin is not allowed in production and has been removed from ALLOWED_ORIGINS.',
      );
    });

    it('should handle production environment without wildcard origin cleanly', () => {
      // ARRANGE
      const env = 'https://app.example.com, https://admin.example.com';
      const isProduction = true;

      // ACT
      const result = resolveCorsOrigins(env, isProduction, mockLogger);

      // ASSERT
      expect(result).toEqual([
        'https://app.example.com',
        'https://admin.example.com',
      ]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should work without logger instance provided when wildcard is encountered in production', () => {
      // ARRANGE
      const env = '*, https://app.example.com';
      const isProduction = true;

      // ACT & ASSERT
      expect(() => resolveCorsOrigins(env, isProduction)).not.toThrow();
      const result = resolveCorsOrigins(env, isProduction);
      expect(result).toEqual(['https://app.example.com']);
    });

    it('should retain wildcard pattern origins as RegExp in production and strip standalone wildcard', () => {
      // ARRANGE
      const env =
        'https://collaborative-saving.web.app, *, https://mobile-collaborative-saving--*.web.app';
      const isProduction = true;

      // ACT
      const result = resolveCorsOrigins(env, isProduction, mockLogger);

      // ASSERT
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('https://collaborative-saving.web.app');
      expect(result[1]).toBeInstanceOf(RegExp);

      const pattern = result[1] as RegExp;
      expect(
        pattern.test(
          'https://mobile-collaborative-saving--pr268-feat-issue-176-upda-bnlymtx6.web.app',
        ),
      ).toBe(true);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        'Wildcard "*" origin is not allowed in production and has been removed from ALLOWED_ORIGINS.',
      );
    });
  });

  describe('shouldEnableSwagger', () => {
    it('should return true when nodeEnv is undefined', () => {
      // ARRANGE & ACT
      const result = shouldEnableSwagger(undefined, undefined);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should return true when nodeEnv is development', () => {
      // ARRANGE & ACT
      const result = shouldEnableSwagger('development', 'false');

      // ASSERT
      expect(result).toBe(true);
    });

    it('should return true when nodeEnv is test', () => {
      // ARRANGE & ACT
      const result = shouldEnableSwagger('test', 'false');

      // ASSERT
      expect(result).toBe(true);
    });

    it('should return false when nodeEnv is production and ENABLE_SWAGGER is not true', () => {
      // ARRANGE & ACT
      const result = shouldEnableSwagger('production', undefined);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return false when nodeEnv is production and ENABLE_SWAGGER is "false"', () => {
      // ARRANGE & ACT
      const result = shouldEnableSwagger('production', 'false');

      // ASSERT
      expect(result).toBe(false);
    });

    it('should return true when nodeEnv is production and ENABLE_SWAGGER is "true"', () => {
      // ARRANGE & ACT
      const result = shouldEnableSwagger('production', 'true');

      // ASSERT
      expect(result).toBe(true);
    });
  });
});
