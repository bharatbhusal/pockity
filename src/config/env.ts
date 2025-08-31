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
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);
