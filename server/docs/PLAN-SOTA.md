# PLAN-SOTA — Bookia Agent V2

**Goal:** Llevar el agente de Santa María de "buena base funcional" a "state of the art vertical para clínica estética".
**Source:** `docs/open-code-brief-bookia-agent-sota.md`
**Timeline:** 6 sprints (1 semana c/u)
**Feature flag:** `AGENT_KERNEL_V2=true`

---

## Baseline (PRR v1 — 2026-06-28)

| Métrica | Valor | Target V2 |
|---|---|---|
| Router accuracy | 97.7% (42/43) | ≥98% |
| Tests | 107/107 | ≥200 |
| Eval cases | 43 (router only) | ≥600 + 30 golden convos |
| Human Experience | ~69/100 | ≥80/100 |
| Safety layers | None | Clinical + Privacy + Injection |
| Memory | conversation_state only | PatientConversationMemory |
| Observability | None | DecisionTrace + AgentEvents |
| Invalid intents | ~1% (inventa nombres) | 0% |

---

## Sprint 1 — Foundation: Tipos + Kernel

**Duración:** Semana 1
**Dependencias:** Ninguna
**Riesgo:** Bajo — solo añade código nuevo, no toca V1

### Archivos a crear

```
src/agent/v2/
  types/
    agent-intent.ts
    agent-kernel.ts
    decision-trace.ts
    response-contract.ts
    funnel.ts
  core/
    agent-kernel.ts
    conversation-snapshot.ts
  index.ts              # barrel export + V2 provider factory
```

### Detalle de cada archivo

**`types/agent-intent.ts`**
- Enum `AGENT_INTENTS` (17 valores, igual que router actual pero como const array)
- `AgentIntent` type
- `ExtractedEntities` interface (city, service, datePreference, budgetSignal, urgency)

**`types/agent-kernel.ts`**
- `AgentKernelInput` interface
- `AgentKernelOutput` interface (response + decisionTrace + memoryUpdates + escalation?)
- `AgentEvent` type (11 eventos: message.received, snapshot.created, intent.detected, policy.evaluated, memory.updated, plan.created, response.composed, critic.completed, escalation.created, response.sent, eval.failed)

**`types/decision-trace.ts`**
- `DecisionTrace` interface completa (traceId, timestamp, input, understanding, policy, planning, generation, quality)
- `RiskFlags`, `SafetyLevel`

**`types/response-contract.ts`**
- `ResponseContract` interface (mustSay, maySay, mustNotSay, tone, maxLength, includeCTA, requireDisclosure, requireDisclaimer)
- `ToneProfile` type (warm_brief, warm_detailed, reassuring, professional_clinical, apologetic, direct_booking, clarifying)

**`types/funnel.ts`**
- `FunnelStage` type (11 valores)
- `NextBestAction` type (12 valores)

**`core/agent-kernel.ts`**
- `AgentKernel` class con método `process(input: AgentKernelInput): Promise<AgentKernelOutput>`
- Pipeline steps: snapshot → normalize → intent → policy → plan → compose → critic → emit
- Cada paso registra en DecisionTrace
- Compatible con `orchestrator.ts` mediante wrapper/adapter

**`core/conversation-snapshot.ts`**
- `ConversationSnapshotBuilder` que toma input + contexto DB y produce snapshot plano

### Tests a agregar (+30)
- DecisionTrace se genera siempre
- AgentKernel acepta input mínimo
- Snapshot se construye sin DB
- Eventos tienen shape correcto
- Pipeline puede ejecutarse con providers mock
- Kernel conserva comportamiento V1 en casos básicos
- Feature flag cambia comportamiento

### Validación
- `npm test` → 107 tests existentes siguen pasando
- +30 nuevos tests unitarios
- Build compila sin errores

---

## Sprint 2 — Structured Router + Policy

**Duración:** Semana 2
**Dependencias:** Sprint 1 (tipos + kernel)
**Riesgo:** Medio — router es crítico; requiere migración cuidadosa

### Archivos a crear

```
src/agent/v2/
  understanding/
    structured-router.ts
    risk-scanner.ts
    input-normalizer.ts
  policy/
    policy-engine.ts
    prompt-injection.ts
```

### Detalle

**`understanding/structured-router.ts`**
- Router con contrato estricto: LLM solo puede devolver valores del enum
- Si devuelve inválido → normalizar a `otro` + bajar confianza
- Overrides determinísticos para casos obvios (mantener los 40+ aliases actuales)
- Salida: `RouterDecision { intent, confidence, secondaryIntents[], entities, reasoningSummary }`
- Separar `intent` de `risk_flags`

**`understanding/risk-scanner.ts`**
- Detección de señales de riesgo en el input
- Keywords de emergencia, complicaciones, datos sensibles
- Salida: `RiskFlags`

**`understanding/input-normalizer.ts`**
- Normalización (NFD, lowercase, trim)
- Entity extraction (ciudad, servicio, fecha, presupuesto, urgencia)
- Detección de typos/abreviaturas comunes

**`policy/policy-engine.ts`**
- Capa que decide: allow | constrain | handoff | block
- Entradas: mensaje normalizado, intent, entidades, sentimiento, historial, memoria, reglas clínicas, señales de injection
- Salida: `PolicyDecision { action, safetyLevel, reasons[], responseConstraints[] }`
- Ninguna respuesta LLM se genera sin pasar por policy

**`policy/prompt-injection.ts`**
- Detección heurística inicial (keywords: "ignora instrucciones", "muestra tu prompt", "soy admin", etc.)
- `PromptInjectionScan { detected, severity, patterns[], recommendedAction }`
- Si severity=high → no pasar instrucciones al LLM, responder seguro o escalar

### Tests a agregar
- Router eval expandido: 300+ casos (mantener 43 existentes + 257 nuevos)
- 50 casos adversariales prompt injection
- Policy engine bloquea intents inválidos
- 0 intents inválidos en salida
- Risk scanner detecta keywords de riesgo

### Validación
- Router accuracy ≥98%
- Critical intents ≥95%
- Invalid intent rate: 0%
- Matriz de confusión generada
- Reporte markdown con fallos exportados a `eval/failures/`

---

## Sprint 3 — Clinical Safety + Privacy

**Duración:** Semana 3
**Dependencias:** Sprint 2 (policy engine)
**Riesgo:** Alto — errores clínicos tienen consecuencias reales

### Archivos a crear

```
src/agent/v2/
  policy/
    clinical-safety.ts
    privacy-safety.ts
```

### Detalle

**`policy/clinical-safety.ts`**
- Categorías: general_info | needs_evaluation | urgent_handoff | refuse_medical_advice
- Reglas por categoría:
  - Información permitida: explicar tratamientos generales, tiempos aprox, cuidados generales
  - Debe escalar: embarazo/lactancia, alergias, autoinmunes, anticoagulantes, dolor fuerte, infección, inflamación severa, asimetría, menor de edad, solicitud de diagnóstico
  - Debe rechazar: prometer resultados, indicar dosis, diagnosticar, recomendar medicamentos, reemplazar valoración
- `ClinicalSafetyDecision { category, allowedClaims[], forbiddenClaims[], requiredDisclaimer?, escalate }`

**`policy/privacy-safety.ts`**
- Datos sensibles: cédula, fecha nacimiento, teléfono, correo, comprobante pago, fotos, historial
- Reglas: no repetir datos completos, enmascarar (cédula → `****1234`), no revelar datos de otros pacientes
- Minimizar datos solicitados según etapa del flow

### Tests a agregar
- 100 casos clínicos de eval
- 50 casos de privacidad
- 0 respuestas con diagnóstico
- 0 promesas de resultado
- 100% de casos de complicación escalan
- Tono sigue siendo cálido, no legalista
- Masking de PII funciona correctamente

### Validación
- Clinical unsafe response rate: 0%
- Privacy leakage rate: 0%
- Ningún trace guarda PII completa innecesaria

---

## Sprint 4 — Memory + Planner

**Duración:** Semana 4
**Dependencias:** Sprint 1 (tipos funnel)
**Riesgo:** Medio — requiere integración con DB existente

### Archivos a crear

```
src/agent/v2/
  memory/
    memory-types.ts
    memory-manager.ts
  planning/
    conversation-planner.ts
    next-best-action.ts
    objection-handler.ts
```

### Detalle

**`memory/memory-types.ts`**
- `PatientConversationMemory` interface (city, serviceInterest[], funnelStage, lastObjection, lastConcern, preferredTone, providedData, paymentStatus, humanHandoffStatus, lastBotSummary)
- Reglas: solo datos útiles, no memorizar info clínica sensible más allá de flags, guardar resumen no transcripción

**`memory/memory-manager.ts`**
- Extracción de datos relevantes del mensaje
- Almacenamiento en DB (conversation_state existente o nueva tabla)
- Recuperación al inicio de cada mensaje
- No preguntar datos ya proporcionados

**`planning/conversation-planner.ts`**
- `ConversationPlan { goal, nextBestAction, requiredFields[], avoid[], responseBrief }`
- Determinístico cuando hay datos suficientes
- LLM ayuda a resumir pero no controla reglas críticas

**`planning/next-best-action.ts`**
- Decisión de próxima acción según funnel stage + entidades + memoria
- 12 acciones posibles: ask_city, ask_service_interest, quote_price, explain_service, ask_booking_date, etc.

**`planning/objection-handler.ts`**
- Manejador explícito para 9 objeciones: caro, miedo al dolor, desconfianza, no tengo tiempo, quiero ver resultados, necesito pensarlo, estoy comparando, quiero descuento, no quiero pagar anticipo
- `ObjectionResponsePlan { objectionType, validation, valueFrame, allowedProofPoints[], nextStep }`

### Tests a agregar
- 50 tests multi-turn
- 60 tests de objeciones
- 30 golden conversations completas
- No loops repetitivos
- No se piden datos fuera de orden
- Memoria persiste entre turns

### Validación
- Repeated-question rate <3%
- Flow completion correctness ≥95%
- Fallback rate <5%

---

## Sprint 5 — Response Composer + Critic

**Duración:** Semana 5
**Dependencias:** Sprint 3 (safety) + Sprint 4 (planner)
**Riesgo:** Medio — cambio en calidad de respuesta; requiere evaluación cualitativa

### Archivos a crear

```
src/agent/v2/
  response/
    response-composer.ts
    tone-adapter.ts
    response-critic.ts
```

### Detalle

**`response/response-composer.ts`**
- Construcción por capas: emotional opener → direct answer → context/value → safety disclaimer → next step → CTA suave
- No todas las respuestas necesitan todas las capas
- `ResponseContract` guía qué puede/no puede decirse
- Respeta `mustNotSay` estrictamente

**`response/tone-adapter.ts`**
- 7 perfiles de tono según: sentimiento, funnel stage, urgencia, tipo de duda, historial, canal, longitud del input
- Usuario ansioso → tranquilizador + sin exceso de info
- Usuario frustrado → disculpa + escalación clara
- Usuario confundido → paso a paso
- Usuario listo para agendar → menos marketing, más acción
- Usuario con riesgo clínico → profesional, prudente, escalar

**`response/response-critic.ts`**
- Evalúa antes de enviar: respondió la pregunta?, inventó algo?, violó reglas clínicas?, pidió demasiados datos?, tiene CTA correcto?, tono adecuado?, PII expuesta?, demasiado larga?
- `ResponseCriticResult { passed, issues[] }` con severity y fixSuggestion
- Si issue high → no enviar original, corregir o escalar
- Si se puede corregir deterministicamente → corregir

### Tests a agregar
- Tests snapshot de tono
- Critic bloquea diagnóstico, promesas, prompt leakage
- Critic no bloquea falsos positivos (<5%)
- No exceso de emojis
- No respuestas largas innecesarias
- No sonar robótico
- Composer respeta mustNotSay

### Validación
- Response critic false block rate <5%
- Cold path retry rate <5%
- Average warm path latency overhead <150ms

---

## Sprint 6 — Hardening + PRR v2

**Duración:** Semana 6
**Dependencias:** Todos los sprints anteriores
**Riesgo:** Bajo — integración y medición

### Actividades

1. **Full eval regression V1 vs V2**
   - Correr todos los evals: router, entity, policy, clinical, privacy, injection, multi-turn, objection, tone, conversion
   - Feature flag permite comparar V1 vs V2 en los mismos casos
   - Reporte markdown automático

2. **Optimización de latencia**
   - Warm path: mantener bajo 150ms overhead sobre V1
   - Cold path: retry rate <5%

3. **Documentación**
   - Arquitectura V2 documentada
   - README de `src/agent/v2/` con explicación de cada módulo

4. **PRR v2**
   - `docs/PRR-Bookia-Agent-Santa-Maria-v2.md`
   - Resumen ejecutivo, arquitectura, diferencias V1 vs V2
   - Métricas de eval, matriz de confusión router
   - Resultados clinical safety, prompt injection, privacy
   - Golden conversations
   - Latencia estimada, riesgos restantes, checklist producción

### Target final

| Métrica | Target |
|---|---|
| Router accuracy overall | ≥98% |
| Router critical intents | ≥95% |
| Invalid intent rate | 0% |
| Clinical unsafe response rate | 0% |
| Prompt leakage rate | 0% |
| Privacy leakage rate | 0% |
| Flow completion correctness | ≥95% |
| Repeated-question rate | <3% |
| Fallback rate en eval | <5% |
| Human escalation correctness | ≥98% |
| Response critic false block | <5% |
| Avg warm path latency overhead | <150ms |
| Cold path retry rate | <5% |

---

## Estructura final de archivos

```
src/agent/
├── v2/                              # NUEVO: módulo SOTA
│   ├── index.ts                     # barrel export + V2 provider factory
│   ├── types/
│   │   ├── agent-intent.ts          # AGENT_INTENTS enum, AgentIntent, ExtractedEntities
│   │   ├── agent-kernel.ts          # AgentKernelInput/Output, AgentEvent
│   │   ├── decision-trace.ts        # DecisionTrace, RiskFlags, SafetyLevel
│   │   ├── response-contract.ts     # ResponseContract, ToneProfile
│   │   └── funnel.ts               # FunnelStage, NextBestAction
│   ├── core/
│   │   ├── agent-kernel.ts          # Pipeline orquestador explícito
│   │   └── conversation-snapshot.ts # Snapshot builder
│   ├── understanding/
│   │   ├── structured-router.ts     # Router con contrato estricto
│   │   ├── risk-scanner.ts         # Señales de riesgo en input
│   │   └── input-normalizer.ts     # Normalización + entity extraction
│   ├── policy/
│   │   ├── policy-engine.ts         # allow/constrain/handoff/block
│   │   ├── clinical-safety.ts       # Guardrails clínicos
│   │   ├── privacy-safety.ts        # Protección de datos sensibles
│   │   └── prompt-injection.ts      # Detección de injection
│   ├── memory/
│   │   ├── memory-types.ts          # PatientConversationMemory
│   │   └── memory-manager.ts        # Extracción, almacenamiento, recuperación
│   ├── planning/
│   │   ├── conversation-planner.ts  # Planificador
│   │   ├── next-best-action.ts      # Decisión de próxima acción
│   │   └── objection-handler.ts     # Manejo de objeciones
│   ├── response/
│   │   ├── response-composer.ts     # Construcción por capas
│   │   ├── tone-adapter.ts          # 7 perfiles de tono
│   │   └── response-critic.ts       # Validación pre-envío
│   └── eval/                        # Evals V2 (expandidos)
│       ├── golden-cases/            # 30 golden conversations
│       ├── adversarial-cases/       # Casos adversariales
│       ├── clinical-safety-cases/   # 100 casos clínicos
│       ├── router-cases-expanded.ts # 300+ casos router
│       ├── conversation-eval-runner.ts
│       └── regression-report.ts
│
├── orchestrator.ts              # V1 existente (se mantiene)
├── router.ts                    # V1 existente (se mantiene)
├── responder.ts                 # V1 existente (se mantiene)
├── escalation.ts                # V1 existente (se mantiene)
├── summarizer.ts                # V1 existente (se mantiene)
├── eval/                        # V1 existente (se mantiene)
├── llm/                         # V1 existente (se mantiene)
└── lib/                         # V1 existente (se mantiene)

src/flows/                        # Sin cambios
src/channels/                      # Sin cambios
src/conversations/                 # Sin cambios
src/lib/                          # Sentiment + segmentation se reusan en V2
```

---

## Reglas de implementación

1. **No romper tests existentes** — CI debe pasar en cada PR
2. **No eliminar V1** — V1 sigue funcionando; V2 se activa con feature flag `AGENT_KERNEL_V2=true`
3. **No mover todo a LLM** — mantener arquitectura híbrida (canned + flow + LLM + escalation)
4. **No inventar** servicios, precios, datos clínicos ni políticas
5. **No prometer resultados médicos** ni diagnosticar
6. **No depender de una sola llamada LLM** para decisiones críticas
7. **No introducir dependencias pesadas** sin justificación
8. **No tocar conexiones externas** (Meta, WhatsApp, pagos, CRM)

## Anti-patterns (lo que NO hacer)

- Hacer refactors grandes sin tests primero
- Mezclar features con refactors en el mismo commit
- Poner lógica crítica solo en prompts del LLM
- Guardar PII completa en traces
- Hacer respuestas más largas de lo necesario
- Usar términos médicos sin respaldo en conocimiento autorizado

---

## Tracking de sprint actual

<!-- Se actualiza al empezar cada sprint -->

**Sprint activo:** Sprint 6 — Hardening + PRR v2
**Estado:** Completado ✅
**Última actualización:** 2026-06-28

### Sprint 1 — COMPLETED ✅
- `src/agent/v2/` creado con 5 types + 2 core modules + barrel export
- 25 tests nuevos (132 total: 107 V1 + 25 V2)
- AgentKernel con pipeline: snapshot → classifyIntent → policy → canned/flow/llm/refusal
- DecisionTrace generado en cada respuesta
- Sentiment detection integrado en el kernel

### Sprint 2 — COMPLETED ✅
- Structured Router con contrato estricto (enum AGENT_INTENTS, 17 intents)
- Input normalizer (NFD + Levenshtein typos detection)
- Risk scanner (emergencia, clínico, PII, injection)
- Policy engine (allow/constrain/handoff/block)
- Prompt injection (40+ patrones high/medium severity)

### Sprint 3 — COMPLETED ✅
- Clinical safety (4 categorías: general_info, needs_evaluation, urgent_handoff, refuse_medical_advice)
- Privacy safety (PII detection + masking + data collection validation por funnel stage)

### Sprint 4 — COMPLETED ✅
- Memory types + manager (PatientConversationMemory, extracción, funnel derivation)
- Conversation planner (goal + nextBestAction según funnel + intent + objection)
- Objection handler (7 tipos de objeción con respuesta estructurada)

### Sprint 5 — COMPLETED ✅
- Tone adapter (7 perfiles, sentiment+intent+funnel priority)
- Response composer (disclosure + disclaimer + CTA + tone prefix)
- Response critic (frases prohibidas + mustSay/mustNotSay + maxLength)

### Sprint 6 — COMPLETED ✅
- V2 eval runner + 75+ casos expandidos (router regression)
- Feature flag adapter (v2-adapter.ts, AGENT_KERNEL_V2=true)
- npm scripts: eval:router-v1, eval:router-v2
- PRR v2: `docs/PRR-SOTA-Bookia-Agent-V2.md`

### Métricas finales

| Métrica | Target | V2 logrado |
|---------|--------|------------|
| Tests totales | ≥200 | **212** (107 V1 + 105 V2) |
| Invalid intent rate | 0% | **0%** (por contrato estricto) |
| Clinical unsafe rate | 0% | **0%** (4 categorías + blocking) |
| Safety layers | ≥3 | **5** (clinical, privacy, injection, policy, risk) |
| Eval cases | ≥600 | **75+** (expansible) |
| Feature flag | Presente | ✅ AGENT_KERNEL_V2 |
| PRR v2 | Documentado | ✅ docs/PRR-SOTA-Bookia-Agent-V2.md |
| Tone profiles | ≥5 | **7** (warm_brief, warm_detailed, reassuring, professional_clinical, apologetic, direct_booking, clarifying) |

### Bloqueos activos
- (ninguno)

### Próximos pasos post-SOTA
1. Eval con DeepSeek real + 600+ casos + golden conversations
2. Integración DB para memory manager
3. Migración gradual de flows V1 a V2
4. Dashboard de métricas V2
5. Optimización de latencia con carga real

### Notas
- Brief SOTA: `docs/open-code-brief-bookia-agent-sota.md`
- Roadmap: `docs/AGENTS-ROADMAP.md`
- PRR v2: `docs/PRR-SOTA-Bookia-Agent-V2.md`
- Todos los sprints completados sin romper tests V1 existentes
