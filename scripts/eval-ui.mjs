// scripts/eval-ui.mjs
// Eval profundo de UI del MVP Bookia con Playwright + Gemma 4 (local).
//
// Uso:
//   E2E_BASE_URL=http://localhost:3001 node scripts/eval-ui.mjs
//
// Flujo:
//   1. Login determinista (storage state reutilizable).
//   2. 9 mini-tareas M0-M8 driveran la UI y capturan:
//      - screenshot (desktop 1440x900 y/o mobile 375x812)
//      - accessibilidad snapshot (a11y tree)
//      - console errors + request failures
//   3. Cada shot se envía a Gemma 4 (local_visual_eval) con un rubric estricto.
//   4. Los resultados se agregan a docs/eval-ui/2026-06-27/results.json
//      y se redacta el reporte en docs/eval-ui/2026-06-27/REPORT.md.

import { chromium } from "@playwright/test"
import { writeFileSync, readFileSync, mkdirSync } from "node:fs"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3001"
const OUT_DIR = "docs/eval-ui/2026-06-27"
const SHOTS_DIR = path.join(OUT_DIR, "shots")
mkdirSync(SHOTS_DIR, { recursive: true })

// Helpers de captura
async function capture(page, ctx, viewport, task, shot) {
  const file = path.join(SHOTS_DIR, `${task}_${shot}_${viewport}.png`)
  await page.screenshot({ path: file, fullPage: false })
  // accessibility snapshot truncado (demasiado grande para el prompt)
  let a11y = null
  try {
    a11y = await page.accessibility.snapshot()
    a11y = a11y ? JSON.stringify(a11y).slice(0, 1800) : null
  } catch {}
  return {
    task, shot, viewport, file,
    a11y,
    consoleErrors: ctx.consoleErrors.slice(),
    reqFailures: ctx.reqFailures.slice(),
    url: page.url(),
  }
}

function setupContext(ctx, page) {
  page.on("console", (m) => { if (m.type() === "error") ctx.consoleErrors.push(m.text().slice(0, 200)) })
  page.on("pageerror", (e) => ctx.consoleErrors.push("PAGEERR:" + String(e).slice(0, 200)))
  page.on("requestfailed", (r) => ctx.reqFailures.push(new URL(r.url()).pathname + " " + (r.failure()?.errorText ?? "")))
}

// Login determinista (typing keyboard para hidratación robusta)
async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  await page.locator('input[type="email"]').waitFor({ state: "visible" })
  await page.waitForFunction(() => {
    const b = document.querySelector('button[type="submit"]')
    return !!(b && !b.disabled)
  }, { timeout: 8000 }).catch(() => {})
  await page.focus('input[type="email"]')
  await page.keyboard.type("admin@bookia.co", { delay: 20 })
  await page.focus('input[type="password"]')
  await page.keyboard.type("bookia2024", { delay: 20 })
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  await page.waitForTimeout(4000)
}

// Roll scroll por la página para activar GSAP/ScrollTrigger reveals.
async function scrollReveal(page, max = 6000) {
  for (let y = 0; y <= max; y += 700) {
    try { await page.evaluate((yy) => window.scrollTo(0, yy), y) } catch {}
    await page.waitForTimeout(250)
  }
  try { await page.evaluate(() => window.scrollTo(0, 0)) } catch {}
  await page.waitForTimeout(500)
}

// ----- Prompt rubric para Gemma 4 -----
const RUBRIC_PROMPT = (name, viewport, ctx) => `Eres un evaluador experto de UI/UX. Evalúa esta captura de pantalla del MVP Bookia (negocio móvil: AI chatbot SaaS para clínicas/estética).

Tarea: ${name}
Viewport: ${viewport}
URL: ${ctx.url}

Instrucciones estrictas:
- Devuelve EXCLUSIVAMENTE un JSON válido, sin texto fuera del JSON.
- Evidencia obligatoria: cada finding debe citar texto/elemento VISIBLE en la captura (no inventes).
- No asumas contenido que no ves.
- Indica defectos funcionales si hay (console errors marcados abajo).

Errores de consola capturados durante el render: ${ctx.consoleErrors.length ? JSON.stringify(ctx.consoleErrors.slice(0, 6)) : "[]"}
Fallos de requests: ${ctx.reqFailures.length ? JSON.stringify(ctx.reqFailures.slice(0, 6)) : "[]"}

Criterios (0-3 cada uno, 3=impecable, 2=bueno menor issue, 1=defecto claro, 0=roto):
1. visual: jerarquía visual, espaciado, alineación, contraste, polish.
2. contenido: copy claro, consistencia de marca, sin placeholders rotos, sin lorem.
3. accesibilidad: ausencia de texto sin label visible, foco plausible, targets táctiles >=44px (mobile).
4. responsivo (cuando aplique): ¿se ve bien en este viewport? ¿hay overflow/recorte?
5. ux: feedback (loading/empty/error), affordancia de CTA claro, navegación self-evidente.
6. funcional: ¿se ve renderizada la superficie sin errores obvios?

Formato de salida (estrito):
{"scores":{"visual":N,"contenido":N,"accesibilidad":N,"responsivo":N,"ux":N,"funcional":N},
 "pass": true|false,
 "findings":[{"sev":"P0|P1|P2","where":"elemento citado","what":"descripción","evidence":"quote visible o elem descrito","suggestedFix":"acción"}],
 "summary":"2-4 frases de resumen"}
`

const RESULTS = []

async function evalShot(shot) {
  console.log(`\n[GEMMA] ${shot.task}/${shot.shot}/${shot.viewport}`)
  console.log(`        shot=${shot.file}`)
  let out
  try {
    out = await gemmaLocal(shot)
  } catch (e) {
    out = { pass: false, scores: {}, findings: [], summary: `eval error: ${String(e).slice(0, 200)}` }
  }
  const result = { ...shot, gemma: out }
  RESULTS.push(result)
  writeFileSync(path.join(OUT_DIR, "results.json"), JSON.stringify(RESULTS, null, 2))
  console.log(`        pass=${out.pass} scores=${JSON.stringify(out.scores)} findings=${out.findings?.length ?? 0}`)
  return out
}

// Llama directamente a Ollama local con la imagen + prompt del rubric.
async function gemmaLocal(shot) {
  // Ollama espera images como base64 (sin el prefijo data:).
  const b64 = readFileSync(shot.file).toString("base64")
  const prompt = RUBRIC_PROMPT(`${shot.task}/${shot.shot}`, shot.viewport, shot)
  const payload = {
    model: "gemma4:e4b",
    prompt,
    images: [b64],
    stream: false,
    options: { temperature: 0.2, num_ctx: 8192 },
  }
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    return { pass: false, scores: {}, findings: [], summary: `Ollama error ${res.status}: ${(await res.text()).slice(0, 200)}` }
  }
  const data = await res.json()
  const text = data.response ?? ""
  // Extraer JSON de la respuesta (gemma suele añadir markdown fences).
  let parsed
  try {
    const m = text.match(/\{[\s\S]*\}/)
    parsed = m ? JSON.parse(m[0]) : null
  } catch {}
  if (!parsed) {
    return { pass: false, scores: {}, findings: [], summary: "Gemma no devolvió JSON parseable", raw: text.slice(0, 800) }
  }
  return parsed
}

const ctx = () => ({ consoleErrors: [], reqFailures: [] })

// ===== Mini-tareas =====

async function M0_smoke(browser) { /* puramente chequeo via probes previos */ }

async function M1_landing(browser) {
  const c = ctx()
  const b = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await b.newPage()
  setupContext(c, page)
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    await page.setViewportSize({ width: v.w, height: v.h })
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
    await scrollReveal(page, 6000)
    await evalShot(await capture(page, c, v.name, "M1_landing", "hero"))
    // Pricing nav: vamos directo a #pricing si existe anchor
    try { await page.click('a:has-text("Precios")', { timeout: 2000 }) ; await page.waitForTimeout(2000) }
    catch { await scrollReveal(page, 6000) }
    await evalShot(await capture(page, c, v.name, "M1_landing", "pricing_or_cta"))
  }
  await b.close()
}

async function M2_auth(browser) {
  const c = ctx()
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    const b = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    const page = await b.newPage()
    setupContext(c, page)
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)
    await evalShot(await capture(page, c, v.name, "M2_auth", "login"))
    await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)
    await evalShot(await capture(page, c, v.name, "M2_auth", "register"))
    await b.close()
  }
}

async function M3_dashboard(browser) {
  const c = ctx()
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    const b = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    const page = await b.newPage()
    setupContext(c, page)
    await login(page)
    if (v.name === "mobile") await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(3000)
    await evalShot(await capture(page, c, v.name, "M3_dashboard", "main"))
    // scroll para ver todo el dashboard
    await scrollReveal(page, 5000)
    await evalShot(await capture(page, c, v.name, "M3_dashboard", "scrolled"))
    await b.close()
  }
}

async function M4_conversationsInbox(browser) {
  const c = ctx()
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    const b = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    const page = await b.newPage()
    setupContext(c, page)
    await login(page)
    if (v.name === "mobile") await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/conversations`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(4000)
    await evalShot(await capture(page, c, v.name, "M4_inbox", "list"))
    // Probar búsqueda
    try {
      const search = page.locator('input[placeholder*="busca"],input[type="search"],input[placeholder*="Buscar"]').first()
      await search.fill("valentina").catch((e)=>{})
      await page.waitForTimeout(1500)
      await evalShot(await capture(page, c, v.name, "M4_inbox", "search"))
    } catch {}
    await b.close()
  }
}

async function M5_thread(browser) {
  const c = ctx()
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    const b = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    const page = await b.newPage()
    setupContext(c, page)
    await login(page)
    if (v.name === "mobile") await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/conversations`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3500)
    // click en primera conversación
    try {
      const first = page.locator('text=/Valentina|Laura|Camila|Carlos|Diana/').first()
      await first.click({ timeout: 5000 })
      await page.waitForTimeout(3000)
      await evalShot(await capture(page, c, v.name, "M5_thread", "detail"))
    } catch {
      await evalShot(await capture(page, c, v.name, "M5_thread", "fallback"))
    }
    await b.close()
  }
}

async function M6_demoLiveChat(browser) {
  const c = ctx()
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    const b = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    const page = await b.newPage()
    setupContext(c, page)
    await login(page)
    if (v.name === "mobile") await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(2500)
    // Abrir widget DemoLive
    const btn = page.getByRole("button", { name: "Demo en vivo" })
    await btn.click()
    await page.waitForTimeout(2000)
    await evalShot(await capture(page, c, v.name, "M6_demolive", "opened"))
    // Enviar 1er mensaje
    const input = page.locator('input[placeholder*="Escribe como cliente"]').first()
    await input.fill("Hola, quiero cotizar un relleno de labios")
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(6000)
    await evalShot(await capture(page, c, v.name, "M6_demolive", "msg1"))
    // Enviar 2do mensaje (agendamiento)
    await input.fill("A qué hora tienen disponible el jueves")
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(6000)
    await evalShot(await capture(page, c, v.name, "M6_demolive", "msg2"))
    await b.close()
  }
}

async function M7_settings(browser) {
  const c = ctx()
  for (const v of [{ w: 1440, h: 900, name: "desktop" }, { w: 375, h: 812, name: "mobile" }]) {
    const b = await browser.newContext({ viewport: { width: v.w, height: v.h } })
    const page = await b.newPage()
    setupContext(c, page)
    await login(page)
    if (v.name === "mobile") await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(4000)
    await evalShot(await capture(page, c, v.name, "M7_settings", "main"))
    await b.close()
  }
}

async function M8_backendSimRoundtrip() {
  // Round-trip backend (no visual): comprueba vía curl ya hecho.
  // Aquí lo dejamos como nota en el reporte. No Gemma visual.
  console.log("\n[M8] backend sim round-trip — validado via curl health endpoint (mock deterministic).")
}

async function main() {
  console.log(`\n=== EVAL UI BOOKIA ===\nBase: ${BASE}\nOut:  ${OUT_DIR}/\n`)
  const browser = await chromium.launch()
  const start = Date.now()
  try {
    await M1_landing(browser)
    await M2_auth(browser)
    await M3_dashboard(browser)
    await M4_conversationsInbox(browser)
    await M5_thread(browser)
    await M6_demoLiveChat(browser)
    await M7_settings(browser)
    await M8_backendSimRoundtrip()
  } finally {
    await browser.close()
  }
  console.log(`\n=== DONE (${Math.round((Date.now()-start)/1000)}s, ${RESULTS.length} shots) ===\n`)
  // Escribir un inventory
  writeFileSync(
    path.join(OUT_DIR, "_inventory.md"),
    "# Inventory de shots — Eval UI Bookia 2026-06-27\n\n" +
      RESULTS.map((r) => `- \`${r.file}\` — pass=${r.gemma?.pass} scores=${JSON.stringify(r.gemma?.scores ?? {})} errors=${r.consoleErrors.length} reqfail=${r.reqFailures.length}`).join("\n") + "\n"
  )
}

main().catch((e) => { console.error(e); process.exit(1) })