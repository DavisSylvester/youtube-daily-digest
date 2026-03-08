import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // MongoDB — optional; not used by the YouTube pipeline
  MONGO_URI: z.string().optional(),
  MONGO_DB: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
  YOUTUBE_API_KEY: z.string().min(1),
  OLLAMA_MODEL: z.string().default('qwen3:8b'),
  OLLAMA_BASE_URL: z.string().default('http://127.0.0.1:11434'),
  // Email — optional; digest is saved to disk even if email is skipped
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_TO: z.string().optional(),
  APP_BASE_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(Bun.env);
