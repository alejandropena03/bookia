# Bookia — Git Bridge Protocol

Sistema de orquestación asíncrona entre dos agentes en dos máquinas distintas.
El repo de GitHub es el canal de comunicación. No hay coordinación en tiempo real.

---

## Arquitectura

```
[Laptop Corporativa (Meli)]            [GitHub: alejandropena03/bookia]      [Máquina personal de Alejandro]
Claude Code (cerebro/arquitecto)  ─push─►   .bridge/ (archivos vivos)   ◄─pull─  OpenCode (ejecutor)
                                  ◄─pull─                                ─push─►
```

**Claude Code (laptop corporativa):**
- Hace research, diseña arquitectura, escribe el TDD, genera código y módulos, define tareas.
- NO puede instalar Docker, Postgres ni herramientas externas (política corporativa Meli).
- Es el dueño del diseño técnico (TDD en `docs/TDD-BACKEND-MVP.md`).

**OpenCode (máquina personal):**
- Ejecuta Docker, Postgres, tests, migraciones, scripts.
- Valida que el código corra en entorno real.
- Implementa las tareas que Claude define, siguiendo el TDD al pie de la letra.
- Reporta resultados, bloqueos y outputs por el bridge.

---

## Fuente de verdad técnica

**`docs/TDD-BACKEND-MVP.md`** es la biblia técnica. Toda tarea traza a una sección de ahí.
OpenCode NO toma decisiones de arquitectura por su cuenta: si algo no está en el TDD, lo marca como bloqueo y se lo devuelve a Claude.

---

## Estructura de archivos

```
.bridge/
├── README.md          ← este protocolo (no modificar sin consenso)
├── CURRENT_TASK.md    ← tarea activa: quién la tiene y qué hacer
├── HANDOFF_LOG.md     ← historial append-only de transfers
├── PENDIENTES.md      ← pendientes compartidos
└── tasks/
    ├── TASK-001.md    ← archivada (inmutable una vez cerrada)
    └── ...
```

---

## Estados de CURRENT_TASK.md

```
WAITING_FOR_OPENCODE → Listo para ejecutar. OpenCode: pull → implementa → valida → push.
IN_PROGRESS_OPENCODE → OpenCode trabajando. Claude: espera.
WAITING_FOR_CLAUDE   → OpenCode terminó o se bloqueó. Claude: revisa, archiva, crea la siguiente.
DONE                 → Tarea cerrada. Claude archiva en tasks/ y crea la siguiente.
```

---

## Flujo de una iteración

**Paso 1 — Claude genera trabajo:**
1. Escribe la definición de la tarea (y a veces código base) en el repo.
2. Crea/actualiza `CURRENT_TASK.md` con `status: WAITING_FOR_OPENCODE`.
3. `git add -A && git commit && git push origin main`

**Paso 2 — OpenCode recibe la posta:**
```bash
git pull origin main
cat .bridge/CURRENT_TASK.md
cat docs/TDD-BACKEND-MVP.md   # contexto técnico
# implementa lo pedido, corre: docker compose up, tests, migración, etc.
```

**Paso 3 — OpenCode entrega resultado:**
1. Actualiza `CURRENT_TASK.md` → `status: WAITING_FOR_CLAUDE`.
2. Agrega notas del resultado (qué hizo, comandos corridos, outputs, bloqueos).
3. Opcionalmente crea `tasks/TASK-NNN-output.md` con outputs relevantes.
4. `git add -A && git commit -m "task(TASK-NNN): resultado" && git push origin main`

**Paso 4 — Claude recibe, revisa, archiva, genera la siguiente tarea. Ciclo.**

---

## Reglas del protocolo

1. `CURRENT_TASK.md` siempre tiene una sola tarea activa.
2. `HANDOFF_LOG.md` es append-only — nunca se edita hacia atrás.
3. Una tarea archivada en `tasks/` es inmutable.
4. El agente que recibe la tarea no cambia el `task_id`.
5. Si hay un bloqueo, el agente que lo detecta escribe `status: WAITING_FOR_CLAUDE` con la razón en Notas.
6. Ambos pushean al mismo repo (`origin`, rama `main`).
7. Siempre hacer `git pull` antes de editar `.bridge/`.
8. OpenCode sigue el TDD; no inventa arquitectura ni sale del alcance del MVP.
9. Cada tarea cierra reportando: archivos creados/modificados, decisiones, supuestos, bloqueos, tests corridos, próxima acción sugerida.

---

## Cola de tareas (modo eficiente — encadenamiento)

Para avanzar más rápido sin esperar a Claude en cada handoff, Claude puede emitir un **lote** de tareas: la activa en `CURRENT_TASK.md` y las siguientes en `.bridge/queue/TASK-NNN.md` (`status: QUEUED`).

**Regla de encadenamiento para OpenCode:**
1. Termina la tarea activa y verifica TODOS sus criterios de completación (los tests deben pasar de verdad).
2. Si **pasó sin bloqueos** y la tarea dice "continúa según protocolo de cola": mueve la siguiente `QUEUED` de `queue/` a `CURRENT_TASK.md`, ponla `WAITING_FOR_OPENCODE`/`IN_PROGRESS_OPENCODE`, archiva la anterior en `tasks/`, agrega línea al HANDOFF_LOG, y sigue.
3. Si hubo **cualquier bloqueo, criterio que no pasa, o decisión de arquitectura ambigua**: para, deja `status: WAITING_FOR_CLAUDE` con el bloqueo descrito, y NO tomes la siguiente. Claude revisa.
4. Tareas marcadas explícitamente "Claude quiere revisar a fondo" (ej. hitos): al terminarlas, `WAITING_FOR_CLAUDE` aunque pasen — no encadenes.
5. Commitea y pushea cada tarea por separado (un commit por TASK) para que Claude pueda revisar el historial limpio.

Claude revisa el lote completo de una vez cuando OpenCode llega a un punto de parada (bloqueo o hito), en vez de tarea por tarea. Esto ahorra iteraciones sin perder verificación: cada commit por tarea deja el diff revisable.

## Convenciones de commit

```
task(TASK-NNN): descripción breve    ← al completar o actualizar una tarea
bridge: descripción                  ← al actualizar el protocolo
```
