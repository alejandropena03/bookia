import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://bookia:bookia_pass@localhost:5432/bookia"),
  DATABASE_URL_APP: z.string().url().default("postgres://bookia_app:bookia_app_pass@localhost:5432/bookia"),
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LLM_PROVIDER: z.enum(["deepseek", "mock"]).default("mock"),
  DEEPSEEK_API_KEY: z.string().default(""),
  MODEL_ROUTER: z.string().default("deepseek-chat"),
  MODEL_RESPONDER: z.string().default("deepseek-chat"),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.flatten());
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
