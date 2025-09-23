import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_PORT: z.string(),
  NEXT_PUBLIC_SERVER_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
  NEXT_PUBLIC_PORT: process.env.NEXT_PUBLIC_PORT,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
});
