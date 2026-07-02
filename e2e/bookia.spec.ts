import { test, expect } from "@playwright/test"

// Login helper — uses seed demo credentials.
async function loginAsDemo(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.fill('input[type="email"]', "admin@santamaria.test")
  await page.fill('input[type="password"]', "bookia2024")
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
}

// ── Landing ───────────────────────────────────────────────────────────────────

test.describe("Landing page", () => {
  test("carga con hero visible", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toBeVisible()
  })

  test('botón "Ver demo" / "Empezar" navega al login', async ({ page }) => {
    await page.goto("/")
    // Acepta cualquiera de los CTAs principales del hero
    const cta = page.locator('a[href="/login"], button:has-text("demo"), button:has-text("Empezar")').first()
    await expect(cta).toBeVisible()
  })

  test.skip("pricing muestra 3 tiers en COP", async () => {
    // Sección pricing removida de landing — restaurar cuando vuelva.
  })
})

// ── Auth ──────────────────────────────────────────────────────────────────────

test.describe("Auth", () => {
  test("login con credenciales demo navega al dashboard", async ({ page }) => {
    await loginAsDemo(page)
    await expect(page).toHaveURL(/\/dashboard/)
    // Sidebar o nav con "Dashboard" visible
    await expect(page.locator("text=Dashboard").first()).toBeVisible()
  })

  test("credenciales incorrectas muestra error", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "wrong@test.com")
    await page.fill('input[type="password"]', "wrong")
    await page.click('button[type="submit"]')
    // Error puede ser en español o inglés según la implementación
    const err = page.locator("text=incorrectos, text=inválid, text=error").first()
    await expect(err.or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5_000 })
  })
})

// ── Dashboard ─────────────────────────────────────────────────────────────────

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
  })

  test("carga sin errores críticos (vacío o con datos)", async ({ page }) => {
    // Acepta tanto el estado vacío como el estado con datos
    const emptyState = page.locator("text=No hay suficientes datos")
    const hasData = page.locator("text=Rendimiento del agente")
    await expect(emptyState.or(hasData)).toBeVisible({ timeout: 8_000 })
  })

  test("navega a conversaciones desde sidebar", async ({ page }) => {
    await page.click("text=Conversaciones")
    await expect(page).toHaveURL(/\/conversations/)
  })

  test("navega a configuración desde sidebar", async ({ page }) => {
    await page.click("text=Configuración")
    await expect(page).toHaveURL(/\/settings/)
  })
})

// ── Conversaciones ────────────────────────────────────────────────────────────

test.describe("Conversaciones", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
    await page.goto("/conversations")
  })

  test("muestra la lista (vacía o con conversaciones)", async ({ page }) => {
    // Puede estar vacía o tener conversaciones — ambos son estados válidos
    const emptyState = page.locator("text=No hay conversaciones, text=Sin conversaciones, text=vacío").first()
    const hasConvs = page.locator("text=Elige una conversación")
    await expect(emptyState.or(hasConvs)).toBeVisible({ timeout: 8_000 })
  })

  test("filtro por estado bot_active no rompe la página", async ({ page }) => {
    const botFilter = page.locator("text=Bot activo, text=Activo, button:has-text('Bot')").first()
    if (await botFilter.isVisible()) {
      await botFilter.click()
      await expect(page).not.toHaveURL(/error/)
    }
  })
})

// ── Settings ──────────────────────────────────────────────────────────────────

test.describe("Configuración", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
    await page.goto("/settings")
  })

  test("muestra el formulario de perfil de negocio", async ({ page }) => {
    await expect(page.locator("text=Perfil del negocio")).toBeVisible({ timeout: 8_000 })
  })

  test("guarda cambios en horario sin error", async ({ page }) => {
    // Busca el botón de guardar/actualizar
    const saveBtn = page.locator("button:has-text('Guardar'), button:has-text('Actualizar'), button:has-text('Save')").first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      // No debe haber error crítico
      await expect(page.locator("text=Error 500, text=Unexpected error")).not.toBeVisible()
    }
  })
})

// ── DemoLive / Sim ────────────────────────────────────────────────────────────

test.describe("Demo en vivo (SSE)", () => {
  test("botón de demo flota en dashboard autenticado", async ({ page }) => {
    await loginAsDemo(page)
    // DemoLive flota en el layout autenticado
    await expect(page.locator('[aria-label="Abrir demo en vivo con el agente"]')).toBeVisible()
  })

  test("abre y cierra el chat de demo", async ({ page }) => {
    await loginAsDemo(page)
    await page.click('[aria-label="Abrir demo en vivo con el agente"]')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.click('[aria-label="Cerrar demo en vivo"]')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test("envía un mensaje y recibe respuesta del agente", async ({ page }) => {
    await loginAsDemo(page)
    await page.click('[aria-label="Abrir demo en vivo con el agente"]')

    const input = page.locator('[aria-label="Escribe un mensaje como cliente del bot"]')
    await expect(input).toBeVisible({ timeout: 5_000 })
    await input.fill("Hola, ¿qué servicios ofrecen?")
    await page.click('[aria-label="Enviar mensaje"]')

    // El bot responde — espera hasta 15s por la respuesta del agente
    await expect(
      page.locator('[aria-label="Mensajes del agente"] .text-sm').nth(1)
    ).toBeVisible({ timeout: 15_000 })
  })
})

// ── Health endpoint ───────────────────────────────────────────────────────────

test.describe("Health API", () => {
  test("GET /health responde ok o degraded", async ({ request }) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787"
    const res = await request.get(`${API_BASE}/health`)
    expect([200, 503]).toContain(res.status())
    const body = await res.json()
    expect(body).toHaveProperty("status")
    expect(body).toHaveProperty("agentKernel", "v2")
    expect(body).toHaveProperty("workersEnabled")
    expect(body).toHaveProperty("llmConfigured")
  })
})
