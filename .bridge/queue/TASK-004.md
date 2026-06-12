---
task_id: TASK-004
status: QUEUED
owner: opencode
created_by: claude
depends_on: TASK-003
---

## Misión
Implementar la **capa de modelo LLM provider-agnostic** con un gateway intercambiable y un `MockLlmProvider`, más el esqueleto del **harness de evaluación de modelos**. Nada de modelo premium cableado: el modelo se elige por config y se pueden comparar varios (incluido uno barato tipo DeepSeek).

## Contexto
- Fuente de verdad: `docs/TDD-BACKEND-MVP.md` §5.4 (capa de modelo) y principio #1 (provider-agnostic).
- DECISIÓN DEL DUEÑO: NO casarse con un modelo premium. Validar modelos baratos. Por eso el gateway y el eval harness son parte del MVP, no un extra.

## Entregable
1. **`server/src/agent/llm/types.ts`** — interfaz `LlmProvider.complete({ system, messages, tools?, model })` → `LlmResult { text, toolCalls?, usage: { inputTokens, outputTokens }, model }`. Tipos de `Msg`, `Tool` (JSON schema).
2. **`server/src/agent/llm/openrouter.ts`** — `OpenRouterProvider` que llama a OpenRouter (un endpoint, muchos modelos). Lee `OPENROUTER_API_KEY` y el modelo por parámetro/config. Soporta tool calling (formato OpenAI-compatible que OpenRouter expone). Maneja errores y rate limits con retry/backoff básico.
3. **`server/src/agent/llm/mock.ts`** — `MockLlmProvider` determinístico para tests (responde según reglas simples, sin red, devuelve usage simulado).
4. **`server/src/agent/llm/index.ts`** — factory que elige provider por env (`LLM_PROVIDER=openrouter|mock`) y expone `getLlm()`. Modelos configurables: `MODEL_ROUTER`, `MODEL_RESPONDER`.
5. **`server/src/agent/eval/`** — harness: dado un set de casos (`eval/cases/*.json`: conversación de entrada + criterios esperados) corre cada caso contra una lista de modelos (`EVAL_MODELS`), calcula costo (tokens × precio del modelo, tabla de precios en `eval/pricing.ts`) y un score básico (heurísticas: ¿menciona precio del catálogo?, ¿no alucina?, longitud, etc.), y emite un **reporte markdown** comparativo. NO necesita ser perfecto; es la base para decidir el modelo con datos.
6. **`.env.example`** actualizado con las nuevas vars (sin secretos reales).

## Criterio de completación (pega outputs)
1. `npm test`: tests con `MockLlmProvider` (sin red) pasan — completar, tool calling, usage.
2. `npm run build` compila.
3. Si hay `OPENROUTER_API_KEY` disponible: un smoke test real contra 1 modelo barato (ej `deepseek/deepseek-chat` o similar) que devuelva texto. Si NO hay key, documenta que quedó listo pero sin probar contra red y deja el comando para correrlo.
4. `npx tsx src/agent/eval/run.ts` (o script equivalente) genera un reporte comparativo de ejemplo (puede ser con MockLlm si no hay key) en `eval/reports/`.

## Fuera de alcance
- El cerebro del agente que USA esta capa (TASK-005). Aquí solo la capa de modelo + eval.
- Decidir el modelo final (eso lo hace el dueño tras ver el reporte con casos reales de Carlos).

## Notas
- OpenRouter usa API OpenAI-compatible; un cliente HTTP simple basta, no metas SDKs pesados.
- La tabla de precios en `pricing.ts` ponla con valores aproximados y CITA que son aproximados/configurables (no inventes precisión).
- Al terminar: `status: WAITING_FOR_CLAUDE` si quieres revisión, o sigue a TASK-005 según protocolo de cola. Commit `task(TASK-004): capa LLM provider-agnostic + eval harness`, push, línea en HANDOFF_LOG.
