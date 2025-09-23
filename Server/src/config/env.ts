import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z
    .string()
    .default("8080")
    .transform((val) => parseInt(val)),
  LOG: z
    .string()
    .transform((x) => x === "true")
    .default("false"),
  ENCRYPTION_KEY: z.string().min(32).max(64),
  JWT_SECRET: z.string().min(32),

  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string(),
  CLOUDFRONT_URL: z.string().url(),
  CLOUDFRONT_DIST_ID: z.string(),
  AWS_REGION: z.string(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_MAIL_ID: z.string().email(),
  SMTP_PASSWORD: z.string(),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);
