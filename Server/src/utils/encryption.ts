import crypto from "crypto";
import { env } from "../config/env";

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

export const decrypt = (hash: string) => {
  const parts = hash.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid hash format: must contain exactly one colon.");
  }
  const [ivHex, encryptedText] = parts;
  if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedText)) {
    throw new Error("Invalid hash format: IV or encrypted text is not valid hex.");
  }
  const ivBuffer = Buffer.from(ivHex, "hex");
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, ivBuffer);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
