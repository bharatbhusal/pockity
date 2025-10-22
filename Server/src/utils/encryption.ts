import crypto from "crypto";
import { env } from "../config/env";

// Derive a 32-byte key from the ENCRYPTION_KEY env variable
const getKey = () => {
  return crypto.createHash("sha256").update(env.ENCRYPTION_KEY).digest(); // 32-byte buffer
};

/**
 * Encrypts a text string using AES-256-CBC.
 * Returns a string in the format: iv:ciphertext (both hex).
 */
export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16); // random 16-byte IV
  const key = getKey();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

/**
 * Decrypts a string in the format iv:ciphertext.
 */
export const decrypt = (hash: string) => {
  const parts = hash.split(":");
  if (parts.length !== 2) throw new Error("Invalid hash format: must contain exactly one colon.");

  const [ivHex, encryptedHex] = parts;
  if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
    throw new Error("Invalid hash format: IV or ciphertext is not valid hex.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};
