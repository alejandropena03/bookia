import { describe, it, expect } from "vitest";
import { app } from "../src/index.ts";

describe("GET /health", () => {
  it("returns status and db fields", async () => {
    const res = await app.request("/health");
    expect([200, 503]).toContain(res.status);

    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("db");
    expect(body).toHaveProperty("timestamp");
  });

  it("returns 200 for root", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Bookia API");
  });
});
