import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z
    .string()
    .default("8080")
    .transform((val) => parseInt(val)),
  LOG: z
    .string()
    .transform((x) => x === "true")
    .default("false"),
  ENCRYPTION_KEY: z.string().min(32).max(64).default(""),
  JWT_SECRET: z.string().min(32).default("your-super-secret-jwt-key-change-in-production"),
  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);
