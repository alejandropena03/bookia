# Skill: clinical-safety-gate

**name:** clinical-safety-gate
**description:** Gate obligatorio antes y después de tocar `agent/v2/policy/clinical-safety*` o cualquier archivo bajo `agent/v2/understanding/` que afecte routing de riesgo. Corre el audit log real + eval crítico. Baseline: 0 fails en audit, eval crítico/reviewed en verde (referencia: 97.3%, 182/187 revisados, `server/reports/a12-eval-final-2026-06-30.md`).

## Cuándo usar
Antes de editar: `clinical-safety.ts`, `clinical-safety-audit.ts`, `policy-engine.ts`, `safety-pre-router.ts`, `risk-scanner.ts`, `deterministic-domain-route.ts`, `prompt-injection.ts`, `privacy-safety.ts`. Y de nuevo después, antes de declarar la tarea terminada.

## Instrucciones

```bash
cd /Users/alejandropena/Bookia/bookia-code/server

# 1. Snapshot de fails ANTES del cambio (baseline)
node -e "
const fs=require('fs');
const lines=fs.readFileSync('data/clinical-audit-log.jsonl','utf8').trim().split('\n').filter(Boolean);
const fails=lines.map(l=>JSON.parse(l)).filter(e=>e.verdict==='fail');
console.log('fails en audit log:', fails.length, '/', lines.length, 'entries');
fails.slice(-5).forEach(f=>console.log(' -', f.inputPreview, '|', f.failures));
"

# 2. Eval crítico (rápido, no el set completo de 411 casos)
npx tsx src/agent/v2/eval/eval-runner.ts --critical-only --reviewed-only --output markdown
```

Hacer el cambio. Repetir el paso 1 y 2 después.

## Criterios de aceptación
- El audit log es append-only e histórico — **no** se espera 0 fails absolutos (hay
  224/4205 acumulados de antes de los fixes de router del 29-30 jun, confirmado
  2026-07-01). Lo que importa es el **delta**: el número de fails DESPUÉS del cambio
  menos el número ANTES no debe ser positivo.
- Eval crítico/reviewed: score no debe bajar respecto a la última corrida conocida (ver `server/reports/a12-eval-final-2026-06-30.md` para el número de referencia — 97.3%, 182/187).
- Cualquier `fail` **nuevo** (posterior al snapshot "antes") con `failures` relacionado a contraindicaciones, PII, o escalación → bloquea, no se reporta como "listo" sin decisión explícita de Alejandro.

## Si falla
No marcar la tarea como done. Reportar el `inputPreview` + `failures` exactos del audit log, y el delta de score del eval crítico. Esto es seguridad clínica — no aplica "documentar y seguir".
