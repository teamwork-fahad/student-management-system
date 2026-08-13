import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().default("appxwind_super_secret_key_2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().default(3000),
  NODE_ENV: z.string().default("development"),
  SUPER_ADMIN_NAME: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:", parsedEnv.error.flatten().fieldErrors);
}

const env = parsedEnv.success
  ? parsedEnv.data
  : {
      DATABASE_URL: process.env.DATABASE_URL || "",
      JWT_SECRET: process.env.JWT_SECRET || "appxwind_super_secret_key_2026",
      JWT_EXPIRES_IN: "7d",
      PORT: 3000,
      NODE_ENV: process.env.NODE_ENV || "production",
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    };

export default env;
