/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface LoggerLike {
  warn: (message: string) => void;
  log?: (message: string) => void;
}

/**
 * Resolves allowed CORS origins based on configuration and environment.
 *
 * Rules:
 * - When allowedOriginsEnv is provided, splits by comma, trims whitespace, and filters empty strings.
 * - If allowedOriginsEnv is not provided or empty, falls back to default localhost origins.
 * - In production (isProduction = true), wildcards ('*') are strictly disallowed to prevent
 *   unauthorized cross-origin access and CORS conflicts with credentialed requests.
 *   Any wildcard '*' is removed and a warning is logged.
 */
export function resolveCorsOrigins(
  allowedOriginsEnv?: string,
  isProduction = false,
  logger?: LoggerLike,
): string[] {
  let origins: string[];

  if (allowedOriginsEnv && allowedOriginsEnv.trim().length > 0) {
    origins = allowedOriginsEnv
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  } else {
    origins = [
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:8080',
    ];
  }

  if (isProduction) {
    if (origins.includes('*')) {
      logger?.warn(
        'Wildcard "*" origin is not allowed in production and has been removed from ALLOWED_ORIGINS.',
      );
      origins = origins.filter((origin) => origin !== '*');
    }
  }

  return origins;
}

/**
 * Determines whether Swagger documentation (/api) should be enabled.
 *
 * Rules:
 * - Enabled in non-production environments by default.
 * - In production, disabled by default unless explicitly enabled via ENABLE_SWAGGER === 'true'.
 */
export function shouldEnableSwagger(
  nodeEnv?: string,
  enableSwaggerEnv?: string,
): boolean {
  return nodeEnv !== 'production' || enableSwaggerEnv === 'true';
}
