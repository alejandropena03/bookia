import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    env: {
      LLM_PROVIDER: "mock",
      NODE_ENV: "test",
    },
  },
});
