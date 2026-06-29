import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .default("postgres://bookia:bookia_pass@localhost:5432/bookia"),
    DATABASE_URL_APP: z
      .string()
      .url()
      .default("postgres://bookia_app:bookia_app_pass@localhost:5432/bookia"),
    PORT: z.coerce.number().default(8787),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LLM_PROVIDER: z.enum(["deepseek", "mock"]).default("mock"),
    DEEPSEEK_API_KEY: z.string().default(""),
    MODEL_ROUTER: z.string().default("deepseek-v4-flash"),
    MODEL_RESPONDER: z.string().default("deepseek-v4-flash"),
    AGENT_KERNEL_V2: z.coerce.boolean().default(true),
    WORKERS_ENABLED: z.coerce.boolean().default(false),
    SSE_STREAM_SECRET: z.string().default(""),
    DEV_AUTH: z.coerce.boolean().default(true),
    AUTH_SECRET: z.string().default("dev-secret-not-used-in-mvp"),
    WOMPI_PUBLIC_KEY: z.string().default(""),
    WOMPI_PRIVATE_KEY: z.string().default(""),
    WOMPI_EVENTS_KEY: z.string().default(""),
    WOMPI_SANDBOX: z.coerce.boolean().default(true),
  })
  .refine(
    (data) => data.LLM_PROVIDER !== "deepseek" || data.DEEPSEEK_API_KEY.length > 0,
    {
      message:
        "DEEPSEEK_API_KEY is required when LLM_PROVIDER=deepseek. Set LLM_PROVIDER=mock for tests/eval without a key.",
    }
  );

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const err of result.error.errors) {
      console.error(`  - ${err.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
