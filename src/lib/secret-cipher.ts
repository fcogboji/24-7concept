import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encrypts/decrypts opaque strings (webhook signing secrets, API tokens) at
 * rest using AES-256-GCM. Storage format:
 *
 *   enc_v1:<base64url-iv>:<base64url-ciphertext>:<base64url-tag>
 *
 * The `enc_v1:` prefix lets `decryptSecret` detect legacy plaintext rows
 * created before encryption was introduced and pass them through unchanged.
 * That avoids a forced backfill — old rows continue to sign correctly while
 * any update to a row re-stores it encrypted.
 *
 * The encryption key is derived (via SHA-256) from SECRET_ENCRYPTION_KEY in
 * the environment so any high-entropy string of any length works. Refuse to
 * encrypt without it in production rather than silently downgrading to
 * plaintext.
 */

const PREFIX = "enc_v1:";

function getKey(): Buffer | null {
  const raw = process.env.SECRET_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

export function isEncryptionConfigured(): boolean {
  return getKey() !== null;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SECRET_ENCRYPTION_KEY is not set. Generate a 32-byte secret and set it in the host env before storing webhook secrets in production.",
      );
    }
    // Dev convenience: store as plaintext so local development without the
    // env var still works. The decrypt path detects this and returns it raw.
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${ct.toString("base64url")}:${tag.toString("base64url")}`;
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) {
    // Legacy plaintext row from before encryption was added.
    return stored;
  }
  const key = getKey();
  if (!key) {
    throw new Error(
      "SECRET_ENCRYPTION_KEY is not set but the stored value is encrypted. Restore the env var to decrypt webhook secrets.",
    );
  }
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 3) {
    throw new Error("Encrypted secret is malformed");
  }
  const [ivB64, ctB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const ct = Buffer.from(ctB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString("utf8");
}
