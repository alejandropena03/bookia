import { test, expect } from "@playwright/test"

// Login helper reutilizable. baseURL proviene de playwright.config (E2E_BASE_URL, default :3001).
async function loginAsDemo(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.fill('input[type="email"]', "admin@bookia.co")
  await page.fill('input[type="password"]', "bookia2024")
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/)
}

test.describe("Landing page", () => {
  test("carga correctamente con hero visible", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toContainText("Tu negocio responde solo")
    await expect(page.locator("text=Empezar gratis").first()).toBeVisible()
  })

  test('botón "Ver demo" navega al login', async ({ page }) => {
    await page.goto("/")
    await page.click("text=Ver demo")
    await expect(page).toHaveURL(/\/login/)
  })

  test("pricing muestra 3 tiers en COP", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=$99.000")).toBeVisible()
    await expect(page.locator("text=$249.000")).toBeVisible()
    await expect(page.locator("text=$499.000")).toBeVisible()
  })
})

test.describe("Auth", () => {
  test("login con credenciales demo navega al dashboard", async ({ page }) => {
    await loginAsDemo(page)
    await expect(page.locator("text=Dashboard").first()).toBeVisible()
  })

  test("credenciales incorrectas muestra error", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "wrong@test.com")
    await page.fill('input[type="password"]', "wrong")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=Email o contraseña incorrectos")).toBeVisible()
  })
})

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
  })

  test("muestra las 4 métricas principales", async ({ page }) => {
    await expect(page.locator("text=Mensajes hoy")).toBeVisible()
    await expect(page.locator("text=Citas agendadas")).toBeVisible()
    await expect(page.locator("text=Tasa conversión")).toBeVisible()
    await expect(page.locator("text=Tiempo respuesta")).toBeVisible()
  })

  test("link de conversación navega al módulo", async ({ page }) => {
    await page.click("text=Conversaciones")
    await expect(page).toHaveURL(/\/conversations/)
  })
})

test.describe("Conversaciones", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
    await page.goto("/conversations")
  })

  test("muestra la lista de conversaciones", async ({ page }) => {
    await expect(page.locator("text=Valentina Morales")).toBeVisible()
  })

  test("click en conversación muestra el thread", async ({ page }) => {
    await page.click("text=Valentina Morales")
    await expect(page.locator("text=relleno de labios")).toBeVisible()
  })
})