/**
 * Square Token Encryption Utility
 *
 * Provides secure encryption/decryption for Square OAuth tokens
 * using AES-256-GCM for authenticated encryption.
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get the encryption key from environment
 * In production, use a dedicated secret management service
 */
function getEncryptionKey(): string {
  const key = process.env['SQUARE_TOKEN_ENCRYPTION_KEY'];
  if (!key) {
    // In development, derive a key from a secret
    const secret = process.env['NEXTAUTH_SECRET'] || 'development-secret-key';
    return crypto.createHash('sha256').update(secret).digest('hex').substring(0, 64);
  }
  return key;
}

/**
 * Derive a key from the encryption key using PBKDF2
 */
function deriveKey(salt: Buffer): Buffer {
  const encryptionKey = getEncryptionKey();
  return crypto.pbkdf2Sync(encryptionKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a token for secure storage
 * Returns a base64-encoded string containing salt + iv + authTag + ciphertext
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty token');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from salt
  const key = deriveKey(salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the plaintext
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  // Get the auth tag
  const authTag = cipher.getAuthTag();

  // Combine all parts: salt + iv + authTag + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypt a token from storage
 * Expects a base64-encoded string containing salt + iv + authTag + ciphertext
 */
export function decryptToken(encryptedBase64: string): string {
  if (!encryptedBase64) {
    throw new Error('Cannot decrypt empty token');
  }

  try {
    // Decode from base64
    const combined = Buffer.from(encryptedBase64, 'base64');

    // Extract parts
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Derive key from salt
    const key = deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[Token Decryption] Failed to decrypt token:', error);
    throw new Error('Failed to decrypt token - token may be corrupted or key mismatch');
  }
}

/**
 * Check if a token is encrypted (basic check)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;

  try {
    const decoded = Buffer.from(value, 'base64');
    // Should be at least salt + iv + authTag + some ciphertext
    return decoded.length > SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}
