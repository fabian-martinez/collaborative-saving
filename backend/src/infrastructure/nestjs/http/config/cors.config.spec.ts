/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  resolveCorsOrigins,
  shouldEnableSwagger,
  LoggerLike,
} from './cors.config';

describe('cors.config', () => {
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
        'http://localhost:5173',
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
        'http://localhost:5173',
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
