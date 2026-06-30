# STATUS.md — Bookia MVP

**Última actualización:** 2026-06-29 (Claude Code — A6.img done)
**Tests:** 327/327 ✅ | **tsc:** clean ✅ | **Eval V2:** 62.8% (258/411)
**North star:** MVP Fase 1 completo + V2 100% | NO Meta real | NO Agenda Pro real | NO pagos live

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

### 🔴 Pendiente Sprint 4

| Task | Descripción | Plan ref |
|------|-------------|----------|
| ~~**A6.img**~~ | ✅ **DONE** — 34 imágenes WhatsApp copiadas como wa_01–wa_34.jpg, IMAGE_MANIFEST corregido con datos reales, imageKeys actualizados (DOCX reemplazados por wa_), whitelist en index.ts actualizado | §0.2 |
| **A12** | Eval V2 actualizado 411 casos, reporte honesto | §A12 |
| **B6** | SSE `/api/sim/stream` con auth | §B6 |
| **B7** | Cleanup dead code frontend | §B7 |
| **B8** | Playwright E2E actualizado | §B8 |
| **C4** | Scheduler local workers | §C4 |
| **C5** | Sync docs con verdad en disco | §C5 |
| **C7** | Meta Adapter Spec diseñado (no implementado) | §C7 |
| **C8** | Observabilidad mínima | §C8 |

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
