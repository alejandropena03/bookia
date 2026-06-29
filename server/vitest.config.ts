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
      // V1 tests (agent.test, dashboard.test) expect V1 path; v2-persistence overrides to "true" per-test.
      AGENT_KERNEL_V2: "false",
    },
  },
});
