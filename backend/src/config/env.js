import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().min(1, "JWT_EXPIRES_IN is required"),
  PORT: z.coerce.number().int().positive("PORT must be a positive number"),
  NODE_ENV: z.string().default("development"),
  SUPER_ADMIN_NAME: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsedEnv.data;

export default env;
