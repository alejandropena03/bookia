# Skill: test-gate

**name:** test-gate
**description:** Corre el gate determinístico de Bookia antes de marcar cualquier tarea como done. tsc --noEmit + vitest run. Reporta pass/fail con números exactos. Baseline: 310/310 tests, tsc clean.

## Instrucciones

Ejecutar siempre en este orden:

```bash
cd /Users/alejandropena/Bookia/bookia-code/server

# 1. TypeScript
npx tsc --noEmit 2>&1
# Aceptación: exit 0, sin errores TS

# 2. Tests
npx vitest run 2>&1 | tail -20
# Aceptación: ≥310 tests pass, 0 failures
```

## Criterios de aceptación

- `tsc --noEmit` → exit 0 (sin TS errors)
- `vitest run` → N tests pass, 0 failures (N ≥ baseline anterior)
- Si algún test nuevo fue agregado, N > baseline está bien — documentar nuevo baseline.

## Qué reportar

```
tsc: ✅ clean / ❌ N errores (listar)
tests: ✅ N/N pass (Xs) / ❌ N failures:
  - <nombre test> — <mensaje de error>
baseline anterior: 310
delta: +N tests nuevos / sin cambio
```

## Si falla

1. Leer el error completo (`npx vitest run --reporter=verbose 2>&1 | grep -A 5 "FAIL"`)
2. No marcar la tarea como done.
3. Si es un error introducido por la tarea actual: fix antes de reportar.
4. Si es un error pre-existente desconocido: reportar a Alejandro con evidencia antes de proceder.
5. Nunca `--testTimeout=0` ni skip tests para que "pasen".
