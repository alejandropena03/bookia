import { describe, it, expect } from "vitest";
import { app } from "../src/index.ts";
import { hashPassword, verifyPassword } from "../src/auth/password.ts";

describe("B1 — DB-backed auth", () => {
  it("hashPassword produces a hash different from plaintext", async () => {
    const hash = await hashPassword("bookia2024");
    expect(hash).not.toBe("bookia2024");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifyPassword returns true for correct password, false for wrong", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("secret123", "")).toBe(false);
  });

  it("POST /api/auth/login with valid credentials returns 200 + tenant fields", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@santamaria.test",
        password: "bookia2024",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("admin@santamaria.test");
    expect(body.tenantId).toBeTruthy();
    expect(body.tenantSlug).toBe("santa-maria");
    expect(body.businessName).toBeTruthy();
    expect(body.role).toBe("owner");
  });

  it("POST /api/auth/login with wrong password returns 401", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@santamaria.test",
        password: "wrongpassword",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login with nonexistent email returns 401", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "nobody@nowhere.test",
        password: "anything",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login with missing fields returns 400", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@santamaria.test" }),
    });
    expect(res.status).toBe(400);
  });
});
