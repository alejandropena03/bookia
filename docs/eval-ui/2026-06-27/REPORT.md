# Eval de UI — Bookia MVP — 2026-06-27

**Modelo evaluador:** Gemma 4 (`gemma4:e4b`) local vía Ollama · multimodal
**Harness:** `scripts/eval-ui.mjs` (Playwright → 2 viewports: desktop 1440×900 / mobile 375×812)
**Backend:** `LLM_PROVIDER=mock` determinístico · Docker · `/health` OK
**Shots evaluados:** 26 (desktop + mobile por superficie)
**Hallazgos totales:** 75 — **P0: 1** · **P1: 15** · **P2: 59**

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Pasados (pass=true) | 24 / 26 |
| Fallidos (pass=false) | 2 |
| Defectos críticos (P0) | 1 |
| Defectos importantes (P1) | 15 |
| Defectos menores (P2) | 59 |
| Eje más débil global | Accesibilidad (medias 2.0–2.75) |

### Hallazgos críticos (P0) — bloqueantes UX

#### 1. M7_settings/main/desktop
- **Qué:** Falta un CTA principal y visible para guardar los cambios.
- **Dónde:** Área de configuración general (Perfil del negocio / Tipo de negocio)
- **Evidencia:** Ningún botón 'Guardar' o 'Actualizar' es visible después de modificar la información en las secciones de perfil o tipo de negocio. Esto genera incertidumbre sobre cómo persistir lo
- **Fix sugerido:** Implementar un botón primario y claramente etiquetado ('Guardar Cambios', 'Actualizar Perfil') al final de cada sección editable (Perfil del negocio, Tipo de negocio).

### Top hallazgos importantes (P1) — primeros 5

#### 1. M1_landing/hero/desktop
- **Qué:** Aunque ambos son CTAs, su jerarquía visual es similar. Se debe guiar al usuario a un único camino principal (el más deseado) o diferenciarlos con mayor claridad para evitar la parálisis por análisis.
- **Fix sugerido:** Mantener el botón de demostración ('Ver demo en vivo') como el CTA primario (color sólido/destacado) y relegar el otro a un estilo secundario (outline o texto simple).

#### 2. M1_landing/pricing_or_cta/mobile
- **Qué:** Aunque son enlaces funcionales, es crucial asegurar que estos elementos tengan estados de foco (focus states) visibles para usuarios que navegan con teclado o lectores de pantalla. Su función como navegación debe ser obvia.
- **Fix sugerido:** Implementar un anillo de enfoque visible (outline/ring) en todos los enlaces de conexión para mejorar la accesibilidad del teclado.

#### 3. M2_auth/login/desktop
- **Qué:** Dependencia excesiva de placeholders. Aunque se ven etiquetas visibles ('Email', 'Contraseña'), el uso del placeholder como única guía puede ser insuficiente semánticamente o confuso para lectores de pantalla.
- **Fix sugerido:** Asegurar que los labels sean explícitos y estén asociados correctamente (usando `aria-label` o etiquetas visibles) sin depender del placeholder.

#### 4. M2_auth/register/desktop
- **Qué:** Aunque el placeholder ('tu@negocio.co') es útil, no se especifica claramente si este dominio debe ser usado o si solo sirve como ejemplo de formato. Esto podría generar confusión sobre la estructura del email esperado.
- **Fix sugerido:** Asegurar que el placeholder sea genérico y se complemente con un texto de ayuda claro, como 'ejemplo@dominio.com', para indicar únicamente el formato esperado.

#### 5. M3_dashboard/main/desktop
- **Qué:** Contraste de color en texto sobre fondo claro.
- **Fix sugerido:** Verificar y ajustar los colores de fuente en todos los elementos textuales dentro de los gráficos complejos (como el embudo) para garantizar que cumplan con las pautas mínimas de contraste.

## Scorecard por superficie

| Superficie | n | fail | visual | contenido | a11y | responsivo | ux | funcional |
|---|---|---|---|---|---|---|---|---|
| M1_landing | 4 | 0 | 2.75 | 3.00 | 2.75 | 3.00 | 2.50 | 3.00 |
| M2_auth | 4 | 0 | 2.25 | 2.75 | 2.25 | 3.00 | 2.25 | 3.00 |
| M3_dashboard | 4 | 0 | 2.25 | 3.00 | 2.25 | 2.75 | 2.50 | 3.00 |
| M4_inbox | 4 | 0 | 2.75 | 3.00 | 2.25 | 3.00 | 3.00 | 3.00 |
| M5_thread | 2 | 0 | 2.00 | 2.50 | 2.50 | 2.50 | 2.00 | 3.00 |
| M6_demolive | 6 | 1 | 2.00 | 2.67 | 2.17 | 3.00 | 2.33 | 3.00 |
| M7_settings | 2 | 1 | 2.00 | 3.00 | 2.00 | 3.00 | 2.00 | 3.00 |

_Notación: 3=impecable · 2=bueno menor issue · 1=defecto claro · 0=roto._

## Resúmenes narrativos por superficie

### M1_landing
- **desktop:** La landing page presenta una estructura hero muy sólida con un copy claro y alto contraste visual. El flujo narrativo (Problema -> Solución) es excelente. Los principales ajustes se centran en la optimización de los CTAs: hacer el CTA princ
- **mobile:** La landing page es extremadamente fuerte en contenido (copy claro) y experiencia de usuario, guiando al visitante de manera lógica desde el problema hasta la solución. Los CTAs son altamente visibles y cumplen con los estándares de accesibi

### M2_auth

### M3_dashboard
- **desktop:** El dashboard presenta una estructura profesional, utiliza tarjetas métricas de manera efectiva y la navegación es intuitiva. El contenido es claro y no contiene placeholders rotos. Los puntos de mejora se centran en el pulido visual (espaci
- **mobile:** El dashboard es excelente en su implementación MVP. Cumple con altos estándares de UX y visualización de datos (KPIs), utilizando un diseño basado en tarjetas que facilita la digestión de información crítica. La estructura es limpia, el con

### M4_inbox
- **desktop:** El MVP Bookia presenta una interfaz extremadamente pulida, con una jerarquía visual clara y una navegación intuitiva. Los componentes de lista están bien estructurados y el copy es consistente y profesional. Se recomienda únicamente mejorar
- **mobile:** La pantalla es limpia, altamente funcional y sigue un patrón de diseño móvil estándar muy efectivo. El contenido es impecable y la experiencia de usuario (UX) es intuitiva gracias a la clara jerarquía visual de las conversaciones. Los punto

### M5_thread
- **desktop:** El MVP presenta una estructura sólida, con una clara división entre navegación y detalle del chat. La funcionalidad parece impecable (P3), pero se pueden mejorar la experiencia de usuario en el manejo de listas largas y la claridad contextu
- **mobile:** La interfaz cumple con altos estándares de accesibilidad y responsividad móvil. El flujo conversacional es intuitivo, y los elementos clave como el campo de entrada son muy claros. Se recomienda mejorar ligeramente el espaciado en el encabe

### M6_demolive
- **desktop:** El MVP de Bookia presenta una estructura sólida, utilizando un diseño de tarjetas (cards) que facilita la digestión de métricas complejas. La jerarquía visual es clara y el uso de datos en tiempo real mejora la sensación de valor. Sin embar
- **mobile:** El MVP presenta un diseño limpio y altamente funcional, con excelente claridad en el flujo de usuario (UX) y la adaptación móvil. El contenido es consistente y sin errores visibles. Los puntos a mejorar son menores: se recomienda refinar li

### M7_settings
- **desktop:** La estructura general y la navegación son claras (Puntos fuertes). Sin embargo, hay fallos críticos de UX/funcionalidad al no haber un CTA visible para guardar los datos modificados en las secciones principales. Además, la gestión de servic
- **mobile:** La página de configuración tiene una base sólida y un contenido claro. El diseño es limpio y se adapta perfectamente al viewport móvil. Sin embargo, el principal área de mejora radica en la Experiencia de Usuario (UX), específicamente en me

## Métricas de runtime capturadas por el harness

| Métrica | Valor |
|---|---|
| Shots con errores de consola | 0 |
| Shots con fallos de requests 4xx/5xx | 0 |
| Patrón de error común (WebSocket HMR) | — |

## Fixes sostenibles aplicados previos al eval (Fase 0)

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

1. **M1_landing/desktop** — El CTA principal del encabezado es demasiado genérico y no comunica el valor o el siguiente paso para un usuario que acaba de aterrizar. Esto genera f
2. **M1_landing/desktop** — La sección es funcional pero carece de un titular que la integre al flujo narrativo. Simplemente lista canales sin explicar el beneficio directo para 
3. **M1_landing/desktop** — Mejorar el contexto visual o textual sobre la lista de canales.
4. **M1_landing/mobile** — Mejorar la separación visual (whitespace) para que el titular principal no se sienta pegado al cuerpo de texto explicativo.
5. **M1_landing/mobile** — Redundancia de CTAs primarios. Hay tres llamadas a la acción muy prominentes (header, hero, caja Bookia) que utilizan diferentes textos o botones. Est
6. **M1_landing/mobile** — La transición visual es un poco abrupta. Aunque el contenido fluye lógicamente, se podría mejorar la separación o el contraste para que la segunda sec
7. **M2_auth/desktop** — Confusión en el flujo de inicio de sesión. Este bloque parece una prueba o un acceso rápido que interrumpe la experiencia estándar del usuario.
8. **M2_auth/desktop** — Falta de feedback visible para estados críticos. No se observa cómo el sistema manejará errores (ej. 'Usuario o contraseña incorrectos') ni un estado 
9. **M2_auth/desktop** — El mensaje de restricción ('Mínimo 6 caracteres') está ubicado dentro del placeholder. Esto mezcla la ayuda funcional con el ejemplo de contenido, lo 
10. **M2_auth/desktop** — El enlace de retorno (login) es funcional, pero su contraste y peso visual son muy bajos en comparación con el CTA principal ('Crear cuenta gratis'). 
11. **M2_auth/mobile** — Mejorar la agrupación visual del formulario. Actualmente, los elementos están flotando libremente. Se recomienda envolver todos los inputs y el botón 
12. **M2_auth/mobile** — Aunque la funcionalidad de mostrar/ocultar contraseña es buena, el icono del ojo debe tener un estado visual más claro (ej. cambiar de color o ser lig
13. **M2_auth/mobile** — Separar la acción secundaria de registro. El enlace 'Regístrate' está muy cerca del borde inferior y podría confundirse con un pie de página genérico.
14. **M2_auth/mobile** — El requisito de longitud mínima debe estar visible y ser más prominente.
15. **M2_auth/mobile** — Mejorar la separación visual entre grupos de campos para aumentar la escaneabilidad.
16. **M2_auth/mobile** — Considerar una mejora de la affordancia del selector de tipo de negocio.
17. **M3_dashboard/desktop** — Consistencia en el espaciado vertical.
18. **M3_dashboard/desktop** — Claridad y concisión en el título.
19. **M3_dashboard/desktop** — El análisis del embudo es puramente descriptivo. Aunque muestra dónde hay pérdidas ('Mensajes recibidos' a 'Agendar cita'), no ofrece ninguna recomend
20. **M3_dashboard/desktop** — La agrupación visual de los tres bloques de KPIs ($2.4M, $9.0M, etc.) es funcional pero carece de cohesión visual. Parecen elementos flotantes sin una
21. **M3_dashboard/desktop** — Los iconos utilizados en la barra de navegación son genéricos. Aunque el texto es claro, mejorar los iconos podría hacer que la navegación sea más ráp
22. **M3_dashboard/mobile** — Mejorar la jerarquía visual entre el título principal y el subtítulo contextual.
23. **M3_dashboard/mobile** — Reforzar la claridad del contexto comparativo.
24. **M3_dashboard/mobile** — Asegurar el espaciado táctil adecuado en la cabecera.
25. **M3_dashboard/mobile** — La separación vertical entre el título principal y el subtítulo contextual es mínima.
26. **M3_dashboard/mobile** — El dashboard presenta datos clave, pero carece de una llamada a la acción (CTA) o navegación clara para guiar al usuario después de revisar las métric
27. **M4_inbox/desktop** — Agrupación visual y espaciado.
28. **M4_inbox/desktop** — Claridad en el estado vacío (Empty State).
29. **M4_inbox/desktop** — Falta una etiqueta (label) explícita para el campo de búsqueda.
30. **M4_inbox/desktop** — El estado vacío es funcional, pero carece de un refuerzo visual para guiar al usuario sobre lo que debe hacer.
31. **M4_inbox/desktop** — La distinción visual entre el tab activo y los inactivos es demasiado sutil.
32. **M4_inbox/mobile** — El espaciado vertical (padding) es ligeramente ajustado. Aumentar este espacio mejoraría el ritmo visual y la separación percibida entre los elementos
33. **M4_inbox/mobile** — El botón de retroceso (<) está presente pero no hay un título visible en el encabezado que refuerce la ubicación actual del usuario, más allá del subt
34. **M4_inbox/mobile** — Mejorar la accesibilidad semántica de los filtros. Estos elementos deben estar marcados con roles ARIA apropiados (ej: role='tablist') para que los le
35. **M4_inbox/mobile** — Aumentar la claridad del alcance de la búsqueda. Aunque el campo es visible, no está claro si se puede buscar por nombre, contenido o palabras clave e
36. **M5_thread/desktop** — La lista de chats es densa y puede generar fatiga visual. Al hacer scroll, la referencia del chat activo podría perderse ligeramente.
37. **M5_thread/desktop** — La agrupación de acciones secundarias ('Editar', 'Escalar') es funcional, pero visualmente podría ser más limpia. El término 'Escalar' requiere contex
38. **M5_thread/desktop** — Aunque el placeholder es claro ('Escribe un mensaje...'), no hay indicaciones visuales sobre los tipos de contenido que se pueden enviar (ej. archivos
39. **M5_thread/mobile** — Mejorar la jerarquía visual del encabezado.
40. **M5_thread/mobile** — Mejorar el feedback de envío.
41. **M5_thread/mobile** — Reforzar la identidad de marca en el avatar.
42. **M6_demolive/desktop** — La sección es puramente diagnóstica y carece de un CTA o explicación accionable para los puntos de fuga.
43. **M6_demolive/desktop** — La métrica principal carece de claridad sobre su base de cálculo, lo que puede generar confusión al usuario.
44. **M6_demolive/desktop** — Alta densidad de información y métricas sin suficiente jerarquía visual.
45. **M6_demolive/desktop** — Falta un CTA primario de 'Siguiente Acción' después de revisar las métricas.
46. **M6_demolive/desktop** — Mejorar la separación visual entre secciones principales de navegación.
47. **M6_demolive/desktop** — Falta de separación visual o jerarquía entre bloques de información clave.
48. **M6_demolive/desktop** — El dato es estático y solo muestra la pérdida porcentual sin sugerir el siguiente paso o causa raíz.
49. **M6_demolive/mobile** — La separación entre el logo/título de la aplicación y los iconos de acción del menú es mínima, lo que reduce ligeramente la jerarquía visual.
50. **M6_demolive/mobile** — Aunque funcional, la interacción entre el campo de texto 'Escribe como cliente...' y el botón de enviar podría beneficiarse de una separación visual m
51. **M6_demolive/mobile** — La separación visual entre el título principal y el subtítulo (contexto) podría mejorarse para guiar mejor la lectura.
52. **M6_demolive/mobile** — Aunque la funcionalidad es clara, los botones CTA dentro del flujo de conversación podrían tener un mayor contraste o una separación más marcada para 
53. **M6_demolive/mobile** — Falta la presentación inmediata de métricas clave (KPIs) en el dashboard.
54. **M6_demolive/mobile** — El mensaje de bienvenida es demasiado genérico y no guía al usuario sobre el siguiente paso o la información que debe proporcionar.
55. **M6_demolive/mobile** — La separación visual entre los bloques principales del dashboard es débil, lo que puede causar confusión sobre qué contenido pertenece a qué sección.
56. **M7_settings/desktop** — Los selectores de fecha/hora deben tener etiquetas ARIA o labels explícitos para mejorar la accesibilidad.
57. **M7_settings/desktop** — El texto explicativo sobre la sincronización del catálogo es pasivo y no añade valor funcional.
58. **M7_settings/mobile** — Implementar feedback de éxito al guardar los cambios.
59. **M7_settings/mobile** — Verificar la semántica y asociación de etiquetas para accesibilidad.
