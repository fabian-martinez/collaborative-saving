/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface CryptoServicePort {
  /**
   * Encrypts plaintext string using AES-256-GCM.
   * If value is null, undefined, or empty, returns the value.
   * If value is already encrypted, returns the value without re-encrypting.
   */
  encrypt(plaintext: string | null | undefined): string | null | undefined;

  /**
   * Decrypts ciphertext string formatted as versioned payload (e.g. v1:iv:tag:ciphertext).
   * If value is null, undefined, empty, or not in encrypted format (e.g. legacy plain text), returns as-is.
   */
  decrypt(ciphertext: string | null | undefined): string | null | undefined;

  /**
   * Generates a deterministic Blind Index hash using HMAC-SHA256 with the secret salt.
   * Returns a 64-character hexadecimal digest.
   * If value is null, undefined, or empty, returns null or empty accordingly.
   */
  hashBlindIndex(value: string | null | undefined): string | null | undefined;

  /**
   * Checks whether a given string adheres to the encrypted payload format.
   */
  isEncrypted(value: string | null | undefined): boolean;
}
