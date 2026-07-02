# STATUS.md — Bookia MVP

**Última actualización:** 2026-07-02 (Claude Code — merge `fable5-next-level` + validación live)
**Tests:** 327/327 ✅ | **E2E:** 15/15 ✅ | **tsc:** clean ✅ | **Eval V2:** 97.3% (182/187 reviewed) | 100% clinical-safety
**North star:** MVP Fase 1 completo + V2 97.3% | NO Meta real | NO Agenda Pro real | NO pagos live

## Sprint 5 — merge fable5-next-level (2026-07-02)

Rama trabajada por otra instancia de Claude Code sin Docker/Postgres (contexto completo en
`docs/HANDOFF-NEXT-LEVEL.md`), validada en este repo con DB real antes de mergear a `main`.

- ✅ 6 fixes de conversación del eval de calidad — 5/6 verificados en vivo contra DeepSeek real,
  1 con gap menor (ver AGENTS.md)
- ✅ Fix real: LLM del pipeline V2 sin memoria de conversación (cableado en v2-adapter.ts)
- ✅ Vista `/agenda`, editor de system-prompt override en Settings, franja de rendimiento en dashboard
- ✅ Rediseño visual dashboard/DemoLive/Inbox
- ✅ 3 bugs encontrados en la validación y arreglados antes/durante el merge: PII enmascarando el
  contacto real del negocio en canned/flow, `/agenda` sin proteger en middleware.ts, botón flotante
  de DemoLive tapando "Guardar cambios" en Settings
- ✅ e2e/bookia.spec.ts actualizado (credenciales demo + selectores desactualizados por el rediseño)

---

## Sprint activo: Sprint 4 (M3 + M4)

### ✅ Completado (Sprints 0-3 + inicio Sprint 4)

| Sprint | Tasks |
|--------|-------|
| S0 | C1, C2, C3, C6, A1 |
| S1 | A2, A3, A4, A10, B1 |
| S2 | A5/PR6.1, A6, A7, B2, B3, B4, C9 |
| S3 | A8, A9 (golden 34/39), A11 |
| S4 | A6.1, A6.2, A6.3, A6.4, A6.5, **A6.6**, B5 |

### ✅ Sprint 4 — COMPLETADO

| Task | Estado |
|------|--------|
| A6.img | ✅ 34 fotos WhatsApp HD (wa_01–wa_34.jpg), imageKeys actualizados, whitelist en index.ts |
| A6.kb | ✅ LLM con catálogo multi-moneda (COP/USD/EUR/MXN), persona "Carlos", promos. 5/5 LLM tests |
| B6 | ✅ SSE auth con HMAC token (`POST /api/sim/stream-token`). Dev bypass si `SSE_STREAM_SECRET` vacío |
| B7 | ✅ Eliminados: ChannelBreakdown, ConversionChart, StatusDonut, MetricCard, RecentConversations + recharts + zustand + app/api/conversations + app/api/metrics |
| B8 | ✅ Playwright E2E reescrito — landing, auth, dashboard, conversaciones, settings, DemoLive, health |
| C4 | ✅ Scheduler en index.ts boot — reminders/reengagement/crm cada 30min si `WORKERS_ENABLED=true` |
| C5 | ✅ AGENTS.md + STATUS.md synced con verdad del disco |
| C7 | ✅ `server/docs/meta-adapter-spec.md` — spec completa (contrato, normalización, outbound, security, checklist Fase 2) |
| C8 | ✅ requestLogger middleware (requestId/method/path/status/duration/tenantSlug) + /health extendido (llmConfigured, workersEnabled, lastMigration) |
| **A12** | ✅ **97.3% (182/187)** reviewed | 100% clinical-safety | 0 fallos críticos | Reporte: `server/reports/a12-eval-final-2026-06-30.md` |

### Tarea fuera del plan (solicitada por Alejandro)
- **Seed-demo con conversaciones reales:** reemplazar strings dummy en `seed-demo.ts` con simulaciones del agente real. Ejecutar post-A2/A3 para que pasen por V2.

---

## Deuda técnica activa

| Item | Urgencia | Detalle |
|------|----------|---------|
| JWT auth en producción | CRÍTICA (no bloquea Fase 1) | `resolveTenant` con `DEV_AUTH=false` no valida JWT real — deja pasar sin tenantId |
| Token GitHub rotado | ALTA | Token embebido en remote detectado 2026-06-11 |
| `flows.is_active` boolean | BAJA | Es `integer` 0/1, migrar cuando se toque esa tabla |
| RLS GUC en middleware | MEDIA | `SET app.current_tenant` debe setearse por request en endpoints autenticados |

---

## Decisiones activas (no reabrir)

- V2 desactivado en Fase 1 para Meta real (flag listo, credenciales Fase 2)
- Modelo local descartado — hardware insuficiente (M5 16GB con Docker no da)
- LLM del producto: DeepSeek API `deepseek-v4-flash`. Key en `server/.env` — nunca commitear
- Router feature-freeze: 21 failures LLM requieren refactor SYSTEM_PROMPT — no vale ahora
- `require()` CommonJS en v2-adapter: eliminado (A10 ✅)
- A6.6: Hand Rejuvenation + Masculinización AH como conocimiento defensivo (pricing multi-market + requiresHumanConfirmation)

---

## Protocolo de actualización

Cuando termines una task:
1. Mueve de 🔴 a ✅ en esta tabla
2. Agrega decisiones nuevas al PostgreSQL: `INSERT INTO episodica.decisions ...`
3. Commit del código + push

Cuando empieces sesión: lee este archivo primero, luego `git log --oneline -10`.
