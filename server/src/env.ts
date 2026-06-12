import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://bookia:bookia_pass@localhost:5432/bookia"),
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
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
