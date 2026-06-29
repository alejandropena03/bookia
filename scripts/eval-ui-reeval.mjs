// scripts/eval-ui-reeval.mjs — Re-eval focalizado M3/M6/M7 tras fixes Tier 1.
// Salida a docs/eval-ui/2026-06-27/shots/ (reemplaza shots previos) y results-reeval.json.

import { chromium } from "@playwright/test"
import { writeFileSync, readFileSync, mkdirSync } from "node:fs"
import path from "node:path"

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3001"
const OUT_DIR = "docs/eval-ui/2026-06-27"
const SHOTS_DIR = path.join(OUT_DIR, "shots")
mkdirSync(SHOTS_DIR, { recursive: true })

const RUBRIC = (name, vp, ctx) => `Eres un evaluador experto de UI/UX. Evalúa ESTA captura del MVP Bookia (task_name=${name}, viewport=${vp}, url=${ctx.url}). Devuelve EXCLUSIVAMENTE JSON válido, sin texto fuera. Evidencia obligatoria: cita texto/elemento VISIBLE. No inventes. Errores de consola: ${JSON.stringify(ctx.consoleErrors.slice(0,6))}. Fallos req: ${JSON.stringify(ctx.reqFailures.slice(0,6))}.

Criterios 0-3 (3=impecable,2=bueno,1=defecto,0=roto):
1. visual 2. contenido 3. accesibilidad (labels aria, foco visible, targets>=44px mobile)
4. responsivo 5. ux (loading/empty/error/feedback) 6. funcional (render sin errores obvios)
Output: {"scores":{"visual":N,"contenido":N,"accesibilidad":N,"responsivo":N,"ux":N,"funcional":N},"pass":true|false,"findings":[{"sev":"P0|P1|P2","where":"elem","what":"desc","evidence":"quote","suggestedFix":"accion"}],"summary":"2-4 frases"}`

async function capture(page, ctx, vp, task, shot) {
  const file = path.join(SHOTS_DIR, `${task}_${shot}_${vp}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return { task, shot, viewport: vp, file, url: page.url(), consoleErrors: ctx.consoleErrors.slice(), reqFailures: ctx.reqFailures.slice() }
}

function setup(ctx, page) {
  page.on("console", m => { if (m.type() === "error") ctx.consoleErrors.push(m.text().slice(0,200)) })
  page.on("pageerror", e => ctx.consoleErrors.push("PAGEERR:"+String(e).slice(0,200)))
  page.on("requestfailed", r => ctx.reqFailures.push(new URL(r.url()).pathname+" "+(r.failure()?.errorText ?? "")))
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  await page.locator('input[type="email"]').waitFor({ state: "visible" })
  await page.waitForFunction(() => { const b=document.querySelector('button[type="submit"]'); return !!(b && !b.disabled) }, { timeout: 8000 }).catch(()=>{})
  await page.focus('input[type="email"]'); await page.keyboard.type("admin@bookia.co", { delay: 20 })
  await page.focus('input[type="password"]'); await page.keyboard.type("bookia2024", { delay: 20 })
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  await page.waitForTimeout(4000)
}

async function scrollReveal(page, max=5000) {
  for (let y=0; y<=max; y+=700) { try { await page.evaluate((yy)=>window.scrollTo(0,yy), y) } catch {} await page.waitForTimeout(250) }
  try { await page.evaluate(()=>window.scrollTo(0,0)) } catch {}; await page.waitForTimeout(500)
}

async function gemma(shot) {
  const b64 = readFileSync(shot.file).toString("base64")
  const res = await fetch("http://localhost:11434/api/generate", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"gemma4:e4b", prompt: RUBRIC(`${shot.task}/${shot.shot}`, shot.viewport, shot), images:[b64], stream:false, options:{temperature:0.2, num_ctx:8192} })
  })
  if (!res.ok) return { pass:false, scores:{}, findings:[], summary:`Ollama ${res.status}` }
  const data = await res.json()
  try { const m = (data.response ?? "").match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { pass:false, scores:{}, findings:[], summary:"no JSON" } }
  catch { return { pass:false, scores:{}, findings:[], summary:"parse err" } }
}

const RESULTS = []
async function ev(shot) {
  console.log(`[REEVAL] ${shot.task}/${shot.shot}/${shot.viewport}`)
  const g = await gemma(shot).catch(e => ({ pass:false, scores:{}, findings:[], summary:String(e).slice(0,150) }))
  const r = { ...shot, gemma: g }
  RESULTS.push(r)
  writeFileSync(path.join(OUT_DIR, "results-reeval.json"), JSON.stringify(RESULTS, null, 2))
  console.log(`   pass=${g.pass} a11y=${g.scores?.accesibilidad} findings=${g.findings?.length ?? 0}`)
}

async function M3(browser) {
  const ctx = { consoleErrors: [], reqFailures: [] }
  for (const v of [{w:1440,h:900,name:"desktop"},{w:375,h:812,name:"mobile"}]) {
    const b = await browser.newContext({ viewport:{width:v.w,height:v.h} })
    const page = await b.newPage(); setup(ctx, page); await login(page)
    if (v.name==="mobile") await page.setViewportSize({width:375,height:812})
    await page.waitForTimeout(3000)
    await ev(await capture(page, ctx, v.name, "M3_dashboard", "main"))
    await scrollReveal(page, 5000)
    await ev(await capture(page, ctx, v.name, "M3_dashboard", "scrolled"))
    await b.close()
  }
}

async function M6(browser) {
  const ctx = { consoleErrors: [], reqFailures: [] }
  for (const v of [{w:1440,h:900,name:"desktop"},{w:375,h:812,name:"mobile"}]) {
    const b = await browser.newContext({ viewport:{width:v.w,height:v.h} })
    const page = await b.newPage(); setup(ctx, page); await login(page)
    if (v.name==="mobile") await page.setViewportSize({width:375,height:812})
    await page.waitForTimeout(2500)
    await page.getByRole("button", { name: "Abrir demo en vivo" }).click()
    await page.waitForTimeout(2000)
    await ev(await capture(page, ctx, v.name, "M6_demolive", "opened"))
    const input = page.locator('input[aria-label*="cliente"]').first()
    await input.fill("Hola, quiero cotizar un relleno de labios")
    await page.locator('button[aria-label="Enviar mensaje"]').click()
    await page.waitForTimeout(6000)
    await ev(await capture(page, ctx, v.name, "M6_demolive", "msg1"))
    await b.close()
  }
}

async function M7(browser) {
  const ctx = { consoleErrors: [], reqFailures: [] }
  for (const v of [{w:1440,h:900,name:"desktop"},{w:375,h:812,name:"mobile"}]) {
    const b = await browser.newContext({ viewport:{width:v.w,height:v.h} })
    const page = await b.newPage(); setup(ctx, page); await login(page)
    if (v.name==="mobile") await page.setViewportSize({width:375,height:812})
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(5000)
    // Scroll al fondo para capturar la sticky action bar
    await scrollReveal(page, 5000)
    await ev(await capture(page, ctx, v.name, "M7_settings", "main"))
    await b.close()
  }
}

const browser = await chromium.launch()
const t0 = Date.now()
try {
  await M3(browser)
  await M6(browser)
  await M7(browser)
} finally { await browser.close() }
console.log(`\nDONE reeval: ${RESULTS.length} shots, ${Math.round((Date.now()-t0)/1000)}s`)