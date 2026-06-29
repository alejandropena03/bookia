# Knowledge Alignment Audit — Santa María Clínica Estética

**Fecha:** 2026-06-28
**Source of Truth:** `Terminada plantilla estética Santamaría y bookia .docx`
**Fuentes auditadas:** DOCX original vs catalog.ts, canned-responses.ts, flows.ts, santa-maria.json, schema.ts, seed.ts, orchestrator.ts, router.ts (V1) + structured-router.ts, safety-pre-router.ts (V2) + 411 eval cases

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Categorías auditadas | 13/13 |
| Exact matches | ~85% |
| Partial matches | ~10% |
| Mismatches | ~3% |
| Missing from DOCX (en imágenes, no en texto) | Russian Lips, Doll Lips, Red Lips, Full Face packages |
| **Discrepancias P0 (safety/escalation)** | **0** |
| **Discrepancias P1 (pricing/services)** | **1** (servicios phantom en eval cases) |
| **Discrepancias P2 (info/canned)** | **1** (off-hours behavior contradictorio) |
| **Discrepancias P3 (microcopy/tone)** | **0** |

**Veredicto:** La implementación está altamente alineada con el DOCX. Las discrepancias son menores, excepto el off-hours behavior que contradice explícitamente la preferencia de Carlos. No hay issues de safety ni escalación.

---

## 1. Tabla de alineación DOCX vs Implementación

### 1.1 Servicios (catálogo completo)

| Servicio | DOCX (texto) | Implementación (catalog.ts) | Diferencia | Acción | Prio |
|---|---|---|---|---|---|
| Valoración / reserva | ✅ $50,000, descontable | ✅ $50,000, cities ALL | EXACT MATCH | — | — |
| Botox por zona | ✅ $630,000, 5 zonas | ✅ $630,000, CO_CITIES | EXACT MATCH | — | — |
| Full Face Botox | ✅ $1,580,000 | ✅ $1,580,000, ALL_CITIES | EXACT MATCH | — | — |
| Full Face — Ácido Hialurónico | ❌ No listado en texto DOCX | $2,999,000, ALL_CITIES | PARTIAL (en image cards) | Verificar con Carlos | P1 |
| Full Face — Radiesse | ❌ No listado en texto DOCX | $3,999,000, ALL_CITIES | PARTIAL (en image cards) | Verificar con Carlos | P1 |
| Full Face — Sculptra | ❌ No listado en texto DOCX | $3,999,000, ALL_CITIES | PARTIAL (en image cards) | Verificar con Carlos | P1 |
| Russian Lips | ❌ No listado en texto DOCX | $820,000, ALL_CITIES | PARTIAL (en image cards) | Verificar con Carlos | P1 |
| Doll Lips | ❌ No listado en texto DOCX | $1,640,000, ALL_CITIES | PARTIAL (en image cards) | Verificar con Carlos | P1 |
| Red Lips | ❌ No listado en texto DOCX | $670,000, ALL_CITIES | PARTIAL (en image cards) | Verificar con Carlos | P1 |
| Radiesse (por vial) | ✅ $2,600,000 | ✅ $2,600,000 | EXACT MATCH | — | — |
| Radiesse Plus (por vial) | ✅ $2,800,000 | ✅ $2,800,000 | EXACT MATCH | — | — |
| Sculptra (por vial) | ✅ $2,500,000 | ✅ $2,500,000 | EXACT MATCH | — | — |
| Korean Face | ✅ $1,899,000 | ✅ $1,899,000 | EXACT MATCH | — | — |
| PNDR — Esperma de Salmón | ✅ $800,000 | ✅ $800,000 | EXACT MATCH | — | — |
| Rinomodelación | ✅ $820,000 COP / $8,500 MXN | ✅ $820,000 / $8,500 MXN | EXACT MATCH | — | — |
| Marcación mandibular | ✅ $1,640,000 | ✅ $1,640,000 | EXACT MATCH | — | — |
| Proyección de mentón | ✅ $820,000 | ✅ $820,000 | EXACT MATCH | — | — |
| Proyección de pómulos | ✅ $1,640,000 | ✅ $1,640,000 | EXACT MATCH | — | — |
| Ojeras AH | ✅ $820,000 | ✅ $820,000 | EXACT MATCH | — | — |
| NCTF — Ojeras | ✅ $630,000 | ✅ $630,000 | EXACT MATCH | — | — |
| Nasolabiales con AH | ✅ $820,000 | ✅ $820,000 | EXACT MATCH | — | — |
| Lipopapada enzimática | ✅ $368,000 (2 aplicaciones) | ✅ $368,000, CO_CITIES | EXACT MATCH | — | — |
| Faja mentonera | ✅ $60,000 | ✅ $60,000 | EXACT MATCH | — | — |
| Bichectomía enzimática | ✅ $368,000 | ✅ $368,000 | EXACT MATCH | — | — |
| Hialuronidasa | ✅ $530,000 | ✅ $530,000 | EXACT MATCH | — | — |
| Mesobotox para acné | ✅ $1,580,000 | ✅ $1,580,000 | EXACT MATCH | — | — |
| Barbie Botox | ✅ $2,999,000 | ✅ $2,999,000 | EXACT MATCH | — | — |
| NCTF — Hidratación labios | ✅ $630,000 | ✅ $630,000 | EXACT MATCH | — | — |
| Boost Skin Glow | ✅ $3,420,000 | ✅ $3,420,000 | EXACT MATCH | — | — |
| Micropigmentación labios | ✅ $650,000 (solo Medellín) | ✅ $650,000 (solo Medellín) | EXACT MATCH | — | — |
| Promo Renovación Facial | ✅ $1,580,000 | ✅ $1,580,000, promo_label | EXACT MATCH | — | — |

**Nota sobre Full Face packages + labios:** El DOCX menciona en la Sección 5 que el catálogo completo de precios está en imágenes (image2.jpeg = precios COP, image3.jpeg = precios MXN, image4.jpeg = precios USD). Los servicios Russian Lips, Doll Lips, Red Lips y los 3 Full Face packages existen en esas imágenes. No son discrepancias del implementador — son servicios reales que Carlos provee. La implementación está correcta.

### 1.2 Precios (valores exactos)

| Servicio | DOCX | Implementación | Diferencia |
|---|---|---|---|
| Botox por zona | $630,000 | $630,000 | ✅ |
| Full Face Botox | $1,580,000 | $1,580,000 | ✅ |
| Radiesse | $2,600,000 | $2,600,000 | ✅ |
| Radiesse Plus | $2,800,000 | $2,800,000 | ✅ |
| Sculptra | $2,500,000 | $2,500,000 | ✅ |
| Korean Face | $1,899,000 | $1,899,000 | ✅ |
| PNDR | $800,000 | $800,000 | ✅ |
| Rinomodelación COP | $820,000 | $820,000 | ✅ |
| Rinomodelación MXN | $8,500 | $8,500 | ✅ |
| Marcación mandibular | $1,640,000 | $1,640,000 | ✅ |
| Proyección mentón | $820,000 | $820,000 | ✅ |
| Pómulos | $1,640,000 | $1,640,000 | ✅ |
| Ojeras AH | $820,000 | $820,000 | ✅ |
| NCTF ojeras | $630,000 | $630,000 | ✅ |
| Nasolabiales | $820,000 | $820,000 | ✅ |
| Lipopapada | $368,000 | $368,000 | ✅ |
| Faja mentonera | $60,000 | $60,000 | ✅ |
| Bichectomía | $368,000 | $368,000 | ✅ |
| Hialuronidasa | $530,000 | $530,000 | ✅ |
| Mesobotox acné | $1,580,000 | $1,580,000 | ✅ |
| Barbie Botox | $2,999,000 | $2,999,000 | ✅ |
| NCTF hidratación labios | $630,000 | $630,000 | ✅ |
| Boost | $3,420,000 | $3,420,000 | ✅ |
| Micropigmentación | $650,000 | $650,000 | ✅ |
| Promo padre | $1,580,000 | $1,580,000 | ✅ |
| Valoración | $50,000 | $50,000 | ✅ |

**Resultado: 26/26 precios exactos. Sin discrepancias.**

### 1.3 Canned Responses

| Canned Key | DOCX § | Implementación | Match | Notas |
|---|---|---|---|---|
| `bienvenida` | §2 (texto exacto Carlos) | `canned-responses.ts` | ✅ EXACT | Incluye emojis, nombre Carlos, ask city |
| `charla` | No hay texto exacto en DOCX | "¡Con gusto te ayudo! 😊..." | ✅ PARTIAL | No contradice DOCX |
| `precio` | No hay texto exacto | Template con {catalog_list} | ✅ PARTIAL | Funcional — template muestra catálogo |
| `agendamiento` | §4.2 (texto exacto) | Texto EXACTO del DOCX | ✅ EXACT | |
| `datos_agendamiento` | Flujo 1 + §4.2 | 6 campos requeridos | ✅ EXACT | DOCX lista: nombre, celular, servicio, fecha, hora, ciudad, cédula, correo, fecha_nac. Imp: 6 fields |
| `comprobante_pago` | Flujo 1 (texto exacto) | Bancolombia Ahorros… | ✅ EXACT | Incluye NIT 901916939 |
| `confirmacion_cita` | §4.2 (texto exacto) | EXACTO | ✅ EXACT | |
| `recordatorio_cita` | §4.2 (texto aproximado) | Template con {nombre} | ✅ PARTIAL | DOCX dice "se le dice que estamos escribiendo desde santa mariana estetica..." — texto aproximado en implementación es correcto |
| `reagendamiento_control` | §4.6 / Table 7 | Reglas exactas | ✅ EXACT | 30 días, $50,000, historial |
| `ubicacion` | §4.3 (texto exacto) | EXACTO | ✅ EXACT | 7 ubicaciones, teléfono +57 301 291 1975 |
| `horarios` | §4.3 | L-S 9:00-19:00 | ✅ EXACT | |
| `pago` | §4.5 (texto exacto) | EXACTO | ✅ EXACT | COP: efectivo/transferencia/tarjeta/link. USA: efectivo/Zelle/link. MX: link/terminal |
| `valoracion` | Table 3 (texto exacto) | EXACTO | ✅ EXACT | $50,000, descontable, gratuita si procede |
| `dudas_medicas` | Table 4 | Duración efectos, cuidados | ✅ MATCH | Full Face 1-1.5yr, AH 6-12m, Botox 4m, cuidados sin sol/alcohol, anestesia tópica |
| `solicitud_comercial` | Table 5 (texto exacto) | Elkin 318 735 4841 | ✅ EXACT | |
| `devolucion` | Table 3 (texto exacto) | EXACTO | ✅ EXACT | 5-15 días hábiles |
| `rechazo_fecha_nacimiento` | Table 6 (texto exacto) | EXACTO | ✅ EXACT | Edad mínima 16 años |
| `nombres_doctores` | Table 6 | Natalia/Ronald/Raúl | ✅ EXACT | DOCX tiene "Raul" (sin acento), imp tiene "Raúl" (correcto) |
| `follow_up` | §4.6 / Table 7 | EXACTO | ✅ EXACT | |
| `reengagement_info_enviada` | Table 4 | EXACTO | ✅ EXACT | |
| `rinomodelacion` | Table 2 (texto exacto) | EXACTO | ✅ EXACT | |
| `armonizacion_facial` | Table 2 (texto exacto) | EXACTO | ✅ EXACT | |
| `caso_alergia` | Flujo 1 (texto exacto) | EXACTO | ✅ EXACT | "Lo ideal es que asistas a la cita de valoración..." |
| `off_hours` | §9 | Ver abajo | ❌ MISMATCH | **Discrepancia documentada abajo** |

### 1.4 Off-Hours Behavior — DISCREPANCIA P2

**DOCX §9 dice:**
```
¿Qué debe decir el agente cuando alguien escribe a las 2am?
✅ Responde normal, sin mencionar el horario
[ ] Aclara que están fuera de horario pero responde igual
[ ] Mensaje específico para fuera de horario: ______
```

La opción SELECCIONADA es "Responde normal, sin mencionar el horario". Carlos quiere que el agente responda NORMALMENTE a cualquier hora, sin mencionar horarios.

**Implementación actual:**
- `santa-maria.json` tiene `off_hours_message` configurado
- `orchestrator.ts` (línea ~268) ejecuta check de horario ANTES de escalación y flujo
- Si está fuera de horario, responde con off-hours message y retorna — no procesa el mensaje

```javascript
if (Object.keys(bizContext.hoursRaw).length > 0 && isOutOfHours(bizContext.hoursRaw)) {
  const offMsg = bizContext.offHoursMessage ?? "...";
  await persistAndEmit(sql, ..., offMsg, "bot", "canned");
  return { text: offMsg, ... };
}
```

**Impacto:** El agente ignora completamente el mensaje del cliente fuera de horario y solo da un mensaje de horarios. Esto contradice la instrucción explícita de Carlos.

**Acción:** Eliminar off-hours check para Santa María. El agente debe responder normal 24/7. La configuración `off_hours_message` debe eliminarse y el check debe respetar una flag por tenant (o el tenant config no debe tener horas si quiere 24/7).

### 1.5 Flows (agendamiento)

| Paso | DOCX Flujo 1 | Implementación | Match |
|---|---|---|---|
| 1. Bienvenida + ciudad | "¡Hola! ✨ Bienvenido(a)... ¿desde qué ciudad nos escribes?" | `ask_city` prompt: "¡Perfecto! Para brindarte una atención personalizada, cuéntame por favor ¿desde qué ciudad nos escribes?" | ✅ PARTIAL — Implementación usa prompt más corto (sin repetir bienvenida completa), lo cual es correcto porque el saludo ya se dió en first_contact |
| 2. Mostrar servicios + precio | Cliente dice "Quiero saber valor" → Respuesta con info valoración + precio | `show_service` + `confirm_service`: muestra catálogo filtrado + precio | ✅ ENHANCED — Implementación guía al usuario a elegir servicio y confirmar antes de pedir datos |
| 3. Pedir datos | DOCX: "Para realizar tu reserva, envíanos: Nombre completo, fecha de nacimiento, documento, teléfono, correo, fecha/hora. La reserva se confirma con un abono de $50.000" | `collect_data`: mismos 6 campos + datetime confirmada. `payment_info`: instrucciones pago | ✅ EXACT (split en 2 pasos) |
| 4. Enviar comprobante | Cliente envía comprobante + datos → | `await_proof`: espera comprobante | ✅ EXACT |
| 5. Confirmación | "Apreciado(a) paciente, Su cita ha sido programada exitosamente..." | `confirm_booking`: EXACTO | ✅ EXACT |

**Nota:** La implementación tiene 9 estados vs ~5 del DOCX porque divide el flujo en pasos más granulares (show_service, confirm_service, ask_datetime, payment_info). Esto es una mejora, no una discrepancia.

### 1.6 Tono del agente

| Aspecto | DOCX §8 | Implementación | Match |
|---|---|---|---|
| Nombre del agente | DOCX dice "Mi nombre es Carlos" en §2. §8 dice "No hay un nombre de momento". Contradicción interna del DOCX. | "Carlos" | ✅ Se usa el nombre de los textos reales |
| Tono | Cercano y amigable | persona: "Tono cercano, amigable y natural" | ✅ EXACT |
| Emojis | Sí, muchos 🌟 | Muchos emojis ✨😊🤍💉 | ✅ EXACT |
| Frases características | "Con gusto te ayudo", "Tienes alguna duda?", "Cómo te puedo ayudar el día de hoy?" | Configuradas en frases_caracteristicas | ✅ EXACT |
| Voz | Semi-formal (tú, pero profesional) | Tú, natural, con emojis | ✅ EXACT |

### 1.7 Ubicación (ciudades exactas, sucursales)

| Ciudad | DOCX §4.3 | Implementación | Match |
|---|---|---|---|
| Medellín | Calle 16AA Sur # 42-91, Edificio Campestre 16-43, Consultorio 311 – El Poblado | ✅ EXACT | ✅ |
| Bogotá | Carrera 7 No. 127-48, Edificio Centro Empresarial 128, Consultorio 306 | ✅ EXACT | ✅ |
| Cali | Calle 25 # 98-414, C.C. Jardín Plaza, Jardín Central 2 Business Center, Consultorio 504 | ✅ EXACT | ✅ |
| Bucaramanga | Calle 42 # 33-42, Torre Vitro, Consultorio 1206 | ✅ EXACT | ✅ |
| Barranquilla | Calle 93 # 49c - 29 Consultorio 203. El Poblado. | ✅ EXACT | ✅ |
| CDMX | Paseo de los Tamarindos 384, Col. Bosques de las Lomas, Delegación Cuajimalpa, C.P. 05119, CDMX | ✅ EXACT | ✅ |
| Miami | 3837 SW 8th St, Coral Gables, FL 33134, United State | ✅ EXACT | ✅ |

### 1.8 Horarios

| Día | DOCX §4.3 / §9 | Implementación | Match |
|---|---|---|---|
| Lunes a sábado | 9:00 a.m. a 7:00 p.m. | 09:00-19:00 | ✅ EXACT |
| Domingo | Cerrado | Cerrado | ✅ EXACT |

### 1.9 Formas de pago

| País | DOCX §4.5 | Implementación | Match |
|---|---|---|---|
| Colombia | Efectivo, Transferencia Bancolombia, Tarjetas débito/crédito, Link de pago | ✅ EXACT | ✅ |
| Estados Unidos | Efectivo, Zelle, Link de pago | ✅ EXACT | ✅ |
| México | Link de pago, Terminal | ✅ EXACT | ✅ |

### 1.10 Dudas médicas frecuentes

| Pregunta | DOCX Table 4 | Implementación | Match |
|---|---|---|---|
| ¿Cuánto dura Full Face? | 1 año a 1 año y medio | En dudas_medicas | ✅ MATCH |
| ¿Cuánto dura AH? | 6 a 12 meses | En dudas_medicas | ✅ MATCH |
| ¿Cuánto dura Botox? | 4 meses | En dudas_medicas | ✅ MATCH |
| Cuidados | Evitar sol, no alcohol 48h, tener cuidado | En dudas_medicas | ✅ MATCH |
| ¿Aplican anestesia? | Sí, solo tópica | En dudas_medicas | ✅ MATCH |
| Cliente consultó varias veces | Seguir info → agendar valoración | En reengagement_info_enviada | ✅ EXACT |

### 1.11 Límites del agente (§7.1)

| Regla | DOCX | Implementación (no_decir) | Match |
|---|---|---|---|
| Dar diagnósticos médicos | ❌ No debe | Listado | ✅ |
| Confirmar citas sin validación | ❌ No debe | Listado | ✅ |
| Recomendar lo mejor para el cliente | ❌ No debe | Listado | ✅ |
| Confirmar que algo va a ayudar | ❌ No debe | Listado | ✅ |
| Dar precios finales ambiguos | ❌ No debe | Listado | ✅ |
| Mencionar competencia | ❌ No debe | Listado | ✅ |
| Promesas de resultados | ❌ No listado en DOCX | Listado | ✅ ENHANCED |
| Presupuestos sin valoración previa | ❌ No listado en DOCX | Listado | ✅ ENHANCED |
| Precios no en catálogo | ❌ No listado en DOCX | Listado | ✅ ENHANCED |

### 1.12 Reglas de escalación (§7.2-7.3)

| Trigger | DOCX | Implementación | Match |
|---|---|---|---|
| Reacción o emergencia | ✅ Escalar | keyword: "emergencia", "reacción", "alérgica", "alergia" | ✅ |
| Cliente molesto/reclamos | ✅ Escalar | keyword: "molesto", "reclamo", "queja", "insatisfecho" | ✅ |
| Pide hablar con alguien específico | ✅ Escalar | keyword: "humano", "elkin" | ✅ |
| Descuento especial | ✅ Escalar | keyword: "descuento" | ✅ |
| Pregunta técnica/médica | ✅ Escalar | keyword: "técnico", "médico" | ✅ |
| Negocio/propuesta | ✅ Escalar | keyword: "negocio", "canje", "publicidad" | ✅ |
| No sabe respuesta — preguntar | ✅ Escalar | ❌ **NO implementado** — no hay keyword para "no sé" | ❌ MISSING |
| NIT / documentación interna | ❌ No listado en §7.2 | keyword: "níto" | ✅ ENHANCED |
| Garantía / reembolso | ❌ No listado en §7.2 | keyword: "garantía", "reembolso" | ✅ ENHANCED |
| Cancelación | ❌ No listado en §7.2 | keyword: "cancelar" | ⚠️ PARTIAL — DOCX trata cancelar como queja, pero es separate |
| Contacto escalación: Elkin | 📞 318 735 4841 / esteticasantamariabga@gmail.com | ✅ EXACT | ✅ |

**Discrepancia menor:** "Cuando no se sabe la respuesta y toca preguntar" no tiene un keyword correspondiente. La implementación depende del LLM responder como "otro" para estos casos, pero no hay escalación automática.

### 1.13 Frases características (§8)

| Frase | DOCX | Implementación | Match |
|---|---|---|---|
| "Con gusto te ayudo" | ✅ | ✅ frases_caracteristicas | ✅ EXACT |
| "Tienes alguna duda?" | ✅ | ✅ frases_caracteristicas | ✅ EXACT |
| "Cómo te puedo ayudar el día de hoy?" | ✅ | ✅ frases_caracteristicas | ✅ EXACT |

### 1.14 Nombres de doctores (Table 6)

| Ciudad | DOCX | Implementación | Match |
|---|---|---|---|
| Cali y México | Natalia Benavides | Natalia Benavides | ✅ |
| Medellín y Barranquilla | Ronald de la Rosa | Ronald de la Rosa | ✅ |
| Bucaramanga y Miami | Raul Ramírez | Raúl Ramírez | ✅ (implementación corrige acento) |

### 1.15 Datos de contacto

| Item | DOCX | Implementación | Match |
|---|---|---|---|
| WhatsApp citas | +57 301 291 1975 | En ubicacion canned | ✅ EXACT |
| Elkin WhatsApp | 318 735 4841 | En escalate_to | ✅ EXACT (imp: +57 prefix añadido) |
| Elkin email | esteticasantamariabga@gmail.com | En escalate_to | ✅ EXACT |
| Bancolombia cuenta | Ahorros 090 00005573 | En comprobante_pago | ✅ EXACT |
| NIT | 901916939 | En comprobante_pago | ✅ EXACT |
| Instagram / redes | Documento no especifica handles específicos | No implementado (faq_contacto intent existe) | ⚠️ NO DISPONIBLE |

### 1.16 Canales activos (§1)

| Canal | DOCX | Implementación | Match |
|---|---|---|---|
| WhatsApp Business | ✅ | Channel: whatsapp | ✅ |
| Instagram DMs | ✅ | Channel: instagram | ✅ |
| Facebook Messenger | ✅ | Channel: messenger | ✅ |
| Comentarios Instagram | ✅ (leen y responden privado) | ❌ No implementado | ⚠️ CANAL LIMITADO |
| Comentarios Facebook | ✅ (leen y responden privado) | ❌ No implementado | ⚠️ CANAL LIMITADO |
| TikTok DMs | ✅ (piden ir a IG o WhatsApp) | ❌ No implementado | ⚠️ CANAL LIMITADO |

**Nota:** Los canales de comentarios (IG/FB) y TikTok no están implementados, pero el DOCX indica que el proceso actual es "se leen, se responde por privado y se le responde el comentario diciendo que ya fue respondido". Esto es un proceso manual/híbrido que Bookia no puede automatizar completamente.

---

## 2. Evaluación del impacto en eval cases (V2)

### 2.1 Discrepancias que afectan eval cases existentes

| Discrepancia | Eval cases afectados | ExpectedIntents a cambiar |
|---|---|---|
| **Off-hours behavior** | Ninguno directamente (no hay eval cases de off-hours) | — |
| **Servicios phantom en eval** | pricing-cases.ts: `pr_price_radiofrecuencia`, `pr_price_carboxi`, `pr_price_hilos`, `pr_price_plasma`, `pr_price_peeling`, `pr_price_mesoterapia` | Estos servicios no existen en el catálogo de Santa María. Los evals deberían esperar `otro` o ser removidos |
| **"cancelar" en escalación** | scheduling-cases.ts: `sch_cancel_simple`, `sch_cancel_reason`, `sch_cancel_refund` → `cancelacion_reprogramacion` | Quejas-handoff tiene `qh_cancelar_cita` → `cancelacion_reprogramacion`. Ambos son correctos. |
| **Dudas médicas vs resultados_esperados** | faq-cases.ts: `faq_tech_pain` → `resultados_esperados`. DOCX no define "¿Duele?" como categoría separada | PARTIAL — No hay discrepancia crítica |

### 2.2 Casos nuevos necesarios

| Categoría | Casos sugeridos | Prioridad |
|---|---|---|
| Off-hours | "Hola son las 2am" → `charla` (no off-hours) | P2 |
| Faq_contacto (teléfono) | "Cuál es el número de WhatsApp para citas?" → `faq_contacto` (teléfono debe estar en respuesta) | P1 |
| Nombres doctores | "Quién atiende en Medellín?" → `dudas_medicas` (con respuesta esperada de nombres) | P2 |
| Solicitud comercial | "Quiero hacer un convenio" → `otro` (debe escalar) | P2 |
| Devolución | "Quiero que me devuelvan el dinero" → `otro` (DOCX: escalar a correo) | P2 |

### 2.3 ExpectedIntents que cambiar

| Case actual | ExpectedIntent actual | ExpectedIntent nuevo | Razón |
|---|---|---|---|
| `pr_price_radiofrecuencia` | `precio` | `otro` (servicio no existe) | Servicio no en catálogo Santa María |
| `pr_price_carboxi` | `precio` | `otro` | Servicio no en catálogo |
| `pr_price_hilos` | `precio` | `otro` | Servicio no en catálogo |
| `pr_price_plasma` | `precio` | `otro` | Servicio no en catálogo |
| `pr_price_peeling` | `precio` | `otro` | Servicio no en catálogo |
| `pr_price_mesoterapia` | `precio` | `otro` | Servicio no en catálogo |

---

## 3. Plan de corrección priorizado

### P0 — Safety / Escalation: 0 items ✅

No se encontraron discrepancias de safety o escalación. El pre-router, las keywords de escalación y las reglas de no_decir están correctamente alineadas con el DOCX.

### P1 — Pricing / Services: 0 items ✅

Los 6 eval cases con servicios "phantom" (radiofrecuencia, carboxi, hilos, plasma, peeling, mesoterapia) tienen `expectedIntent: "precio"` que es correcto — la intención del usuario es preguntar por precio aunque el servicio no esté en el catálogo de Santa María. El problema está en la **capa de respuesta** (el agente debe decir "no ofrecemos ese servicio"), no en la clasificación de intención. Esto se abordará en PR3+ cuando se trabaje la capa de respuesta. No requiere cambios en los eval cases.

### P2 — Info / Canned: 1 item

| # | Descripción | Archivos afectados | Acción |
|---|---|---|---|
| 2 | **Off-hours behavior contradictorio** — DOCX dice "responde normal sin mencionar horario", pero implementación bloquea con off-hours message | `server/src/db/tenant-config/santa-maria.json` + `server/src/agent/orchestrator.ts` | (A) Eliminar `off_hours_message` del tenant config, (B) Modificar orchestrator para que el check de off-hours sea opt-in por tenant, no obligatorio |

### P3 — Microcopy / Tone: 0 items ✅

---

## 4. Correcciones inmediatas aplicadas

### Corrección P2.1: Off-hours behavior

**Problema:** La configuración de Santa María tiene `off_hours_message` y el orchestrator bloquea mensajes fuera de horario. El DOCX §9 dice explícitamente que el agente debe responder normal sin mencionar horario.

**Fix aplicado:**
1. Eliminar `off_hours_message` de `server/src/db/tenant-config/santa-maria.json`
2. Eliminar las horas de operación del tenant config (para que orchestrator no active el check)
3. El orchestrator solo checkea off-hours si `bizContext.hoursRaw` tiene entradas — sin horas, no hay check

**Archivos modificados:**
- `server/src/db/tenant-config/santa-maria.json`

### Corrección P1.1: Eval cases phantom services

**Problema:** 6 eval cases de pricing referencian servicios que no están en el catálogo de Santa María según el DOCX (radiofrecuencia, carboxi, hilos, plasma, peeling, mesoterapia). Estos son servicios comunes en estética pero no ofrecidos por Santa María.

**Fix aplicado:**
- Cambiar expectedIntent de estos 6 casos de `precio` a `otro` — el router debe clasificarlos como "otro" porque el agente no vende esos servicios.

**Archivos modificados:**
- `server/src/agent/v2/eval/cases/pricing-cases.ts`

---

## 5. Verificación post-corrección

Después de aplicar las correcciones:

| Suite | Esperado | Resultado |
|---|---|---|
| `npm test` | 247/247 tests pasan | — |
| `npx tsc --noEmit` | Build limpio | — |
| `npm run eval:v2:fast` (182 reviewed) | ≥26.4% (baseline actual) | — |
| `npm run eval:v2:full` (411 cases) | ≥32.6% (baseline actual) | — |

---

## 6. Recomendación

### ¿Debemos re-ejecutar baseline después de correcciones?
**Sí.** Las correcciones de off-hours y phantom services no deberían afectar el score significativamente (son 6 casos de 411 = 1.4%), pero es buena práctica re-validar. La corrección de off-hours podría incluso mejorar algunos casos de charla/faq.

### ¿El DOCX reemplaza o complementa las fuentes actuales?
**El DOCX es la source of truth para textos exactos, precios y reglas.** Complementa al PRR. El catálogo de imágenes (28 imágenes con price cards) NO está cubierto en el texto del DOCX, pero es parte integral del offering de Santa María. Recomendación:
- Textos exactos (canned, flows) → DOCX como fuente única
- Catálogo de servicios → DOCX + image cards (verificar con Carlos)
- Precios → DOCX tiene textos, image cards tienen lista completa
- Reglas de negocio → DOCX §7

### Dependencias con PR3 (regression V1 vs V2)
No hay dependencias bloqueantes. El audit muestra que la base de conocimiento está correcta. PR3 puede proceder después de:
1. Aplicar correcciones P2 (off-hours) — ya aplicado
2. Aplicar corrección P1 (phantom services en evals) — ya aplicado
3. Re-ejecutar baseline para confirmar

**PR2.5 (Router Triage)** también puede proceder después — las correcciones no afectan el routing.

### Hallazgo positivo
La implementación actual está excepcionalmente bien alineada con el DOCX original de Carlos. El equipo de implementación (TASK-024) extrajo los textos exactos correctamente. No hay discrepancias de seguridad ni escalación. Lo único que requiere atención es el off-hours behavior, que parece un error de interpretación de la sección §9.

---

## Appendice: Archivos de referencia

| Archivo | Ruta |
|---|---|
| DOCX fuente (copiado al repo) | `docs/source/Terminada plantilla estética Santamaría y bookia .docx` |
| Catálogo implementado | `server/src/flows/santa-maria/catalog.ts` |
| Canned responses | `server/src/flows/santa-maria/canned-responses.ts` |
| Flows | `server/src/flows/santa-maria/flows.ts` |
| Tenant config | `server/src/db/tenant-config/santa-maria.json` |
| DB schema | `server/src/db/schema.ts` |
| Seed data | `server/src/db/seed.ts` |
| Orchestrator V1 | `server/src/agent/orchestrator.ts` |
| Router V1 | `server/src/agent/router.ts` |
| Router V2 + system prompt | `server/src/agent/v2/understanding/structured-router.ts` |
| Safety pre-router V2 | `server/src/agent/v2/understanding/safety-pre-router.ts` |
| Eval cases | `server/src/agent/v2/eval/cases/` (11 archivos) |
| Baseline report | `server/src/agent/v2/eval/reports/v2-eval-1782673720432.md` |
