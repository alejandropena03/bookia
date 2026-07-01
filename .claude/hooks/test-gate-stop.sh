#!/bin/bash
# Stop hook — sube test-gate (skill existente) a gate obligatorio. Solo corre
# tsc+vitest si algo cambió en server/src desde la última corrida (evita pagar
# el costo en turnos que no tocaron código). Async + asyncRewake: no bloquea
# al usuario, pero si falla, despierta al modelo con el detalle exacto.
# Ver ~/.claude/AGENTIC_DEV_OS_PLAN.md Push 2.
set -uo pipefail

ROOT="/Users/alejandropena/Bookia/bookia-code"
MARKER="$ROOT/.claude/.last-gate-run"
SERVER="$ROOT/server"

mkdir -p "$ROOT/.claude"
if [ ! -f "$MARKER" ]; then
  touch -d "1970-01-01" "$MARKER" 2>/dev/null || touch -t 197001010000 "$MARKER" 2>/dev/null
fi

CHANGED=$(find "$SERVER/src" -newer "$MARKER" -type f 2>/dev/null | head -1)
if [ -z "$CHANGED" ]; then
  exit 0
fi

cd "$SERVER" || exit 0

TSC_OUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?

VITEST_OUT=$(npx vitest run 2>&1 | tail -20)
VITEST_EXIT=$?

touch "$MARKER"

if [ $TSC_EXIT -ne 0 ] || [ $VITEST_EXIT -ne 0 ]; then
  echo "test-gate FALLÓ tras cambios en server/src."
  echo "--- tsc (exit $TSC_EXIT) ---"
  echo "$TSC_OUT" | head -30
  echo "--- vitest (exit $VITEST_EXIT) ---"
  echo "$VITEST_OUT"
  exit 2
fi

exit 0
