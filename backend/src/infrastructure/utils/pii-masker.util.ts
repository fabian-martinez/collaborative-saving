/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

/**
 * Masks an email address to protect privacy.
 * Example: 'juan.perez@example.com' -> 'j***z@example.com'
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) {
    if (trimmed.length <= 2) return '***';
    return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
  }

  const username = trimmed.substring(0, atIndex);
  const domain = trimmed.substring(atIndex);

  if (username.length <= 1) {
    return `*${domain}`;
  }
  if (username.length === 2) {
    return `${username[0]}*${domain}`;
  }

  const firstChar = username[0];
  const lastChar = username[username.length - 1];
  return `${firstChar}***${lastChar}${domain}`;
}

/**
 * Masks an identification / document number.
 * Example: '1234567890' -> '******7890'
 */
export function maskIdentificationNumber(
  idNumber: string | null | undefined,
): string {
  if (!idNumber || typeof idNumber !== 'string') {
    return '';
  }

  const trimmed = idNumber.trim();
  if (trimmed.length <= 4) {
    return '****';
  }

  const visibleDigits = trimmed.substring(trimmed.length - 4);
  const maskedPrefix = '*'.repeat(trimmed.length - 4);
  return `${maskedPrefix}${visibleDigits}`;
}

/**
 * Masks a phone number preserving country code / prefix if present.
 * Example: '+57 300 123 4567' -> '+57 300 *** **67'
 * Example: '3001234567' -> '******4567'
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const trimmed = phone.trim();
  if (trimmed.length <= 4) {
    return '****';
  }

  const visible = trimmed.substring(trimmed.length - 4);
  const maskedPrefix = trimmed
    .substring(0, trimmed.length - 4)
    .replace(/[0-9]/g, '*');

  return `${maskedPrefix}${visible}`;
}

/**
 * Masks general confidential text such as physical address or beneficiary name.
 * Example: 'Calle 123 # 45-67' -> '[PROTEGIDO]'
 */
export function maskGeneral(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return '[PROTEGIDO]';
}
