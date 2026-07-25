import { encryptSecret, decryptSecret } from "./secret-cipher";

/**
 * Helpers to encrypt/decrypt calendar OAuth tokens using AES-256-GCM.
 * Use these when reading/writing CalendarConnection records.
 */

export interface EncryptedTokens {
  accessToken: string;
  refreshToken: string | null;
}

export interface DecryptedTokens {
  accessToken: string;
  refreshToken: string | null;
}

/**
 * Encrypts calendar tokens before storing in database.
 */
export function encryptCalendarTokens(tokens: DecryptedTokens): EncryptedTokens {
  return {
    accessToken: encryptSecret(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
  };
}

/**
 * Decrypts calendar tokens after reading from database.
 */
export function decryptCalendarTokens(encrypted: EncryptedTokens): DecryptedTokens {
  return {
    accessToken: decryptSecret(encrypted.accessToken),
    refreshToken: encrypted.refreshToken ? decryptSecret(encrypted.refreshToken) : null,
  };
}

/**
 * Helper to check if a token string is already encrypted.
 * Returns true if it starts with the encryption prefix.
 */
export function isTokenEncrypted(token: string | null): boolean {
  if (!token) return false;
  return token.startsWith("enc_v1:");
}
