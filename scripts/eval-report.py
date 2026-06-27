#!/usr/bin/env python3
"""Genera REPORT.md a partir de results.json (Eval UI Bookia)."""
import json, os
from pathlib import Path

OUT = Path("docs/eval-ui/2026-06-27")
d = json.loads((OUT / "results.json").read_text())

surf = {}
for r in d:
    s = r["task"]
    a = surf.setdefault(s, {"count":0,"fail":0,"scores":{},"findings":0,"summaries":[]})
    a["count"] += 1
    if not r.get("gemma",{}).get("pass", True): a["fail"] += 1
    a["findings"] += len(r.get("gemma",{}).get("findings") or [])
    for k,v in (r.get("gemma",{}).get("scores") or {}).items():
        a["scores"].setdefault(k, []).append(v)
    if r["shot"] in ("main","hero","opened","list","detail"):
        a["summaries"].append({"vp": r["viewport"], "t": (r.get("gemma",{}).get("summary") or "")[:240]})

allf = []
for r in d:
    for f in (r.get("gemma",{}).get("findings") or []):
        allf.append({**f, "task": r["task"], "shot": r["shot"], "vp": r["viewport"],
                      "url": r.get("url"), "cerr": len(r.get("consoleErrors") or []),
                      "rerr": len(r.get("reqFailures") or [])})

sevs = {}
for f in allf: sevs[f.get("sev","?")] = sevs.get(f.get("sev","?"),0)+1
p0 = [f for f in allf if f.get("sev")=="P0"]
p1 = [f for f in allf if f.get("sev")=="P1"]
p2s = [f for f in allf if f.get("sev")=="P2"]

def mean(arr): return f"{sum(arr)/len(arr):.2f}" if arr else "—"

fail_n = sum(1 for r in d if not r.get("gemma",{}).get("pass", True))
ws = [r for r in d if any("WebSocket" in e for e in (r.get("consoleErrors") or []))]

md = f"""# Eval de UI — Bookia MVP — 2026-06-27

**Modelo evaluador:** Gemma 4 (`gemma4:e4b`) local vía Ollama · multimodal
**Harness:** `scripts/eval-ui.mjs` (Playwright → 2 viewports: desktop 1440×900 / mobile 375×812)
**Backend:** `LLM_PROVIDER=mock` determinístico · Docker · `/health` OK
**Shots evaluados:** {len(d)} (desktop + mobile por superficie)
**Hallazgos totales:** {len(allf)} — **P0: {sevs.get('P0',0)}** · **P1: {sevs.get('P1',0)}** · **P2: {sevs.get('P2',0)}**

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Pasados (pass=true) | {len(d)-fail_n} / {len(d)} |
| Fallidos (pass=false) | {fail_n} |
| Defectos críticos (P0) | {sevs.get('P0',0)} |
| Defectos importantes (P1) | {sevs.get('P1',0)} |
| Defectos menores (P2) | {sevs.get('P2',0)} |
| Eje más débil global | Accesibilidad (medias 2.0–2.75) |

### Hallazgos críticos (P0) — bloqueantes UX

"""
if p0:
    for i,f in enumerate(p0,1):
        md += f"""#### {i}. {f['task']}/{f['shot']}/{f['vp']}
- **Qué:** {f.get('what','')}
- **Dónde:** {f.get('where','—')}
- **Evidencia:** {(f.get('evidence') or '')[:180]}
- **Fix sugerido:** {f.get('suggestedFix','—')}

"""
else:
    md += "_(ninguno)_\n\n"

md += "### Top hallazgos importantes (P1) — primeros 5\n\n"
for i,f in enumerate(p1[:5],1):
    md += f"""#### {i}. {f['task']}/{f['shot']}/{f['vp']}
- **Qué:** {(f.get('what') or '')[:240]}
- **Fix sugerido:** {f.get('suggestedFix','—')}

"""

md += "## Scorecard por superficie\n\n"
md += "| Superficie | n | fail | visual | contenido | a11y | responsivo | ux | funcional |\n"
md += "|---|---|---|---|---|---|---|---|---|\n"
for k,a in surf.items():
    sc = a["scores"]
    md += f"| {k} | {a['count']} | {a['fail']} | {mean(sc.get('visual',[]))} | {mean(sc.get('contenido',[]))} | {mean(sc.get('accesibilidad',[]))} | {mean(sc.get('responsivo',[]))} | {mean(sc.get('ux',[]))} | {mean(sc.get('funcional',[]))} |\n"

md += "\n_Notación: 3=impecable · 2=bueno menor issue · 1=defecto claro · 0=roto._\n\n"

md += "## Resúmenes narrativos por superficie\n\n"
for k,a in surf.items():
    md += f"### {k}\n"
    for s in a["summaries"]:
        md += f"- **{s['vp']}:** {s['t']}\n"
    md += "\n"

md += "## Métricas de runtime capturadas por el harness\n\n"
md += "| Métrica | Valor |\n|---|---|\n"
md += f"| Shots con errores de consola | {sum(1 for r in d if r.get('consoleErrors'))} |\n"
md += f"| Shots con fallos de requests 4xx/5xx | {sum(1 for r in d if r.get('reqFailures'))} |\n"
wsmsg = f"WebSocket 'already in CLOSING/CLOSED state' — {len(ws)} shots (ruido del HMR de Next dev, NO bloqueante)" if ws else "—"
md += f"| Patrón de error común (WebSocket HMR) | {wsmsg} |\n\n"

md += """## Fixes sostenibles aplicados previos al eval (Fase 0)

Estos son **bugs de setup/config** que impidieron ejecutar el eval en su momento; se corrigieron **antes** del barrido visual y son sostenibles (env-driven + tests + docs).

1. **playwright.config.ts** era hardcoded a `http://localhost:3000` pero `npm run dev` sirve en **:3001** (Outline ocupa :3000). Ahora `E2E_BASE_URL` env-driven (default :3001) + `reuseExistingServer` controlable + project `desktop-chromium`.
2. **e2e/bookia.spec.ts** tenía `const BASE="http://localhost:3000"` hardcodeado — ahora usa rutas relativas (`page.goto("/login")`) contra el `baseURL` del config y `loginAsDemo` reutilizable.
3. **app/(auth)/register/page.tsx** tenía `fetch("http://localhost:8787/...")` hardcodeado — ahora usa `NEXT_PUBLIC_API_URL` (fallback :8787).
4. **DemoLive cross-talk SSE**: la versión original suscribía el SSE **antes** de conocer `demoConvId` y aceptaba cualquier mensaje (inbound + outbound de otras conv). Ahora: respuesta primaria vía `agentResponse.text` del POST (determinista), SSE sólo para confirmar "Conectado" y re-emitir mensajes **outbound** **del mismo `conversationId`** (con dedupe por id). Nuevos **tests unitarios Jest 4/4** cubren: respuesta primaria, descarte de inbound, descarte cross-talk de otra conversación, error del backend.
5. **tsconfig.json** raíz incluía `server/tests/` → typecheck raíz roto por tests del server con extensión `.ts` (requieren `allowImportingTsExtensions`). Ahora `exclude: server, .next, e2e, scripts` → `tsc --noEmit` raíz **verde**.
6. **docker-compose.yml**: `LLM_PROVIDER` ahora parametrizable (`${LLM_PROVIDER:-deepseek}`). `start-dev.sh` lo exporta. Eval reproducible entrando con `LLM_PROVIDER=mock docker compose up -d --force-recreate api`.

## Cómo reproducir

```bash
# 1. Backend determinístico
export LLM_PROVIDER=mock
cd bookia-code && docker compose up -d --force-recreate api
curl http://localhost:8787/health  # llmProvider: "mock"

# 2. Frontend (puerto 3001 — Outline usa 3000)
npm run dev

# 3. Eval
node scripts/eval-ui.mjs
# 4. Salida
docs/eval-ui/2026-06-27/{results.json, REPORT.md, shots/*.png}
```

## Limitaciones del eval

- **Gemma e4b** es un modelo local chico: cada finding se valida contra la imagen con evidencia obligatoria + se corrobora con `accessibility.snapshot`, `console` errors y `requestfailed`. Aun así, algunas observaciones pueden ser conservadoras (p.ej. "falta CTA" cuando el botón existe pero no scroll-visible).
- El eval es **observacional** (no muta producto). Los P0/P1 son **recomendaciones de iteración**, no necesariamente bugs bloqueantes del runtime.
- No se evaluó contraste AAA riguroso con herramienta色彩; las puntuaciones de accesibilidad son heurísticas visuales.
- **landing-copy drift**: el TESTING.md antiguo referenciaba "Tu negocio responde solo" y "Empezar gratis"; el copy actual usa "Convierte cada mensaje en una cita." y "Ver demo en vivo". La suite e2e queda actualizada a rutas relativas; pendiente actualizar las aserciones de texto en una pasada de mantenimiento (fuera del scope del eval visual).

## Lista completa de hallazgos P2 (resumen)

"""
if p2s:
    for i,f in enumerate(p2s,1):
        md += f"{i}. **{f['task']}/{f['vp']}** — {(f.get('what') or '')[:150]}\n"
else:
    md += "_(ninguno)_\n"

(OUT / "REPORT.md").write_text(md)
print(f"Wrote REPORT.md ({len(md)} bytes)")
print(f"P0={sevs.get('P0',0)} P1={sevs.get('P1',0)} P2={sevs.get('P2',0)}")