# Current Task: PR8 — Flow Adapter V2

## Goal
Que los flows existentes (agendamiento, precio, first_contact) usen memoria persistente V2 y contexto V2. No queremos tener memoria en DB, router fuerte, policy fuerte y critic fuerte, pero que el flow siga preguntando datos que ya sabe.

## Scope

1. **Agendamiento memory-aware completo** — flujo de agendamiento que consulta memoria persistente antes de pedir datos. Si el usuario ya dio nombre, teléfono, correo, cédula en conversaciones anteriores, el flow no los repregunta.
2. **Precio memory-aware básico** — si el usuario ya mencionó ciudad o servicio antes, el flow de precio usa esa información sin repreguntar.
3. **First contact memory-aware básico** — si el usuario vuelve, el first contact lo reconoce y no lo trata como nuevo.

## Architecture

### Flow Adapter (`src/agent/v2/adapter/flow-adapter.ts`)
Bridge entre el kernel V2 (router + policy + critic) y los flows existentes en `src/flows/`.

```
Kernel V2 (RouterDecision) → FlowAdapter → Flow (existing)
                                      ↕
                              MemoryService (persistente)
```

Responsabilidades:
- Traducir `RouterDecision` en parámetros de flow existentes
- Inyectar memoria de sesiones previas (nombre, teléfono, ciudad, historial)
- Hydratar el contexto del flow con datos que el usuario YA dió antes
- Recibir eventos del flow y persistirlos en memoria V2

### Memory Service (`src/agent/v2/memory/memory-service.ts`)
Abstracción sobre la DB de memoria persistente para que los flows puedan:
- `getUserContext(tenantId, conversationId)` — obtener datos conocidos del usuario
- `setUserContext(tenantId, conversationId, data)` — guardar datos aprendidos
- `getConversationHistory(tenantId, conversationId)` — historial de la sesión

## Pipeline modificado

```
safetyPreRoute → domainRoute → LLM → clinicalPolicy → FlowAdapter → Flow
                                            ↕                         ↕
                                        MemoryService ←────────── eventos
                                                                  (datos aprendidos)
```

## Acceptance Criteria
- FlowAdapter creado en `src/agent/v2/adapter/flow-adapter.ts`
- MemoryService creado en `src/agent/v2/memory/memory-service.ts`
- Agendamiento no repregunta nombre si ya lo sabe
- Agendamiento no repregunta teléfono si ya lo sabe
- Precio usa ciudad ya conocida sin repreguntar
- First contact reconoce usuarios que volvieron
- tsc clean, tests pasan (nuevos + existentes)
- Eval: sin regresiones en routing (mantiene 87.7%)
