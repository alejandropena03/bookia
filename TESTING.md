# Guía de pruebas — Bookia MVP Fase 1

## Setup (5 minutos)

```bash
# Requisitos: Node.js 18+ instalado
git clone [repo] bookia
cd bookia
npm install
npm run dev
# Abre http://localhost:3000
```

---

## Checklist de pruebas manuales

### Landing page (`/`)
- [ ] Se carga en menos de 2 segundos
- [ ] El header muestra el logo "Bookia" con ícono
- [ ] El botón "Ver demo" lleva al `/login`
- [ ] El botón "Empezar gratis" del navbar lleva al `/login`
- [ ] La sección Hero muestra las estadísticas (68%, <2min, 24/7)
- [ ] La sección "El problema" muestra 3 cards con ❌
- [ ] La sección "Cómo funciona" muestra 4 pasos numerados
- [ ] La sección de features muestra 6 cards con íconos
- [ ] ~~El pricing muestra los 3 tiers con precios en COP~~
  - **REMOVIDO (eval-ui 2026-06-27):** la sección pricing fue retirada de la landing.
    El navbar ya no enlaza a `#precios` y ningún componente renderiza los tiers
    Starter/Growth/Pro. Las aserciones e2e quedaron en `test.skip`.
    TODO de producto: restaurar una sección pricing con los tiers COP ($99k/$249k/$499k)
    cuando se defina el modelo de pricing definitivo.
- [ ] El CTA final tiene botón "Empezar ahora"
- [ ] El footer muestra "© 2026 Bookia"
- [ ] La página es usable en mobile (375px)

### Login (`/login`)
- [ ] Se muestra el badge con credenciales: `admin@bookia.co / bookia2024`
- [ ] Login con credenciales correctas → redirige a `/dashboard`
- [ ] Login con email incorrecto → mensaje de error visible
- [ ] El ícono de ojo muestra/oculta la contraseña
- [ ] El link "Regístrate" lleva a `/register`

### Registro (`/register`)
- [ ] Formulario con 4 campos: nombre negocio, email, contraseña, tipo
- [ ] Errores de validación aparecen bajo cada campo
- [ ] El link "Ingresar" lleva al `/login`

### Dashboard (`/dashboard`)
- [ ] Las 4 métricas se muestran con números reales:
  - Mensajes hoy: 47
  - Citas agendadas: 12
  - Tasa conversión: 68%
  - Tiempo respuesta: 1.8 min
- [ ] Gráfico de líneas muestra 30 días de datos (conversaciones vs citas)
- [ ] Gráfico de barras muestra los 3 canales (WhatsApp, Instagram, Facebook)
- [ ] Gráfico donut muestra estados de conversaciones
- [ ] Tabla de conversaciones recientes tiene al menos 5 filas
- [ ] Cada fila muestra: avatar, nombre, canal badge, preview, estado, timestamp
- [ ] Click en fila de conversación → navega a `/conversations/[id]`
- [ ] El sidebar muestra: Dashboard, Conversaciones, Agenda (Próximamente), Analítica (Próximamente), Configuración
- [ ] "Agenda" y "Analítica" tienen badge "Próximamente" y no son clickeables
- [ ] En mobile el sidebar es colapsable con el botón hamburguesa

### Conversaciones (`/conversations`)
- [ ] Lista de conversaciones visible a la izquierda
- [ ] Cada conversación muestra canal badge con color:
  - WhatsApp → verde
  - Instagram → rosa/fucsia
  - Facebook → azul
- [ ] Estado badge visible (Agendada, En curso, Pendiente, Escalada)
- [ ] El buscador filtra por nombre en tiempo real
- [ ] Los tabs (Todos / WA / IG / FB) filtran la lista
- [ ] Click en una conversación → muestra el thread en el centro
- [ ] Los mensajes del cliente aparecen a la izquierda (burbujas blancas)
- [ ] Los mensajes del agente aparecen a la derecha (burbujas púrpura/índigo)
- [ ] Los mensajes IA tienen badge "✨ Sugerida por IA" en índigo claro
- [ ] Los mensajes IA muestran botones: "Aprobar", "Editar", "Escalar"
- [ ] El input de respuesta muestra "Demo — el envío real se activa en Fase 2"
- [ ] El panel derecho muestra info del contacto (visible en pantallas grandes)
- [ ] El botón "Ver en Agenda Pro" está deshabilitado

### Settings (`/settings`)
- [ ] El nombre "Estética Santa María" aparece pre-cargado y es editable
- [ ] Los campos de ciudad y horarios son editables
- [ ] Los 3 canales (WhatsApp, Instagram, Facebook) muestran "No conectado"
- [ ] El botón "Conectar" está deshabilitado
- [ ] Al hacer hover sobre "Conectar" → tooltip "Disponible en Fase 2"
- [ ] El nombre del agente "Sofia" aparece pre-cargado
- [ ] El selector de tono funciona (Formal / Amigable / Mixto)
- [ ] Los toggles de notificaciones cambian de estado al hacer click
- [ ] El botón "Guardar cambios" → muestra "¡Guardado!" por 2 segundos

---

## Tests automatizados

### Tests unitarios (Jest)
```bash
npm run test
```

Tests incluidos:
- `MetricCard` — renderiza título, valor y delta correctamente
- `formatRelativeTime` — "ahora", "hace X min", "hace Xh", "hace Xd"

### Tests E2E (Playwright)
```bash
# Paso 1: levantar el servidor
npm run dev

# Paso 2 (en otra terminal): correr los tests
npm run test:e2e
```

Tests E2E incluidos:
- Landing: carga correcta, botón "Ver demo", precios en COP
- Login: credenciales correctas → dashboard, credenciales incorrectas → error
- Dashboard: 4 métricas visibles, navegación a conversaciones
- Conversaciones: lista visible, click en conversación muestra thread

---

## Solución de problemas comunes

**El servidor no arranca:**
```bash
# Verificar Node.js
node --version  # debe ser 18+

# Reinstalar dependencias
rm -rf node_modules
npm install
```

**Error de autenticación:**
- Verificar que existe `.env.local` con `AUTH_SECRET`
- Usar exactamente: `admin@bookia.co` / `bookia2024`

**Los gráficos no cargan:**
- Verificar que `data/metrics.json` existe
- Los gráficos usan Recharts — requieren JavaScript habilitado
