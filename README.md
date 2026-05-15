# Otelo

App web para organizar las tareas del hogar, pensada para familias o grupos de personas que comparten una casa. Construida con Next.js, Tailwind CSS y Supabase.

El proyecto nació para solucionar un problema común: en una casa con varias personas es fácil perder el hilo de quién hizo qué. Otelo centraliza esto de forma liviana, sin complicaciones innecesarias.

## Funcionalidades

### Dashboard principal

<img width="1919" height="964" alt="imagen" src="https://github.com/user-attachments/assets/31ce4980-1a93-4996-a27f-2eadcf2400ef" />

Las tareas se agrupan por categorías (Cocina, Limpieza, Mascotas, etc.). Cada tarea tiene un umbral configurable (3, 7 o 30 días) que indica visualmente si lleva mucho tiempo pendiente.

### Estadísticas

<img width="1921" height="973" alt="imagen" src="https://github.com/user-attachments/assets/b393fbac-f811-4ca5-862d-cefaa2838dd3" />

Hay estadísticas semanales, mensuales y anuales, para medir las tareas dentro de la casa.

### Consejo familiar

<img width="480" height="241" alt="output" src="https://github.com/user-attachments/assets/3dca4bcc-0438-4acd-8387-c2ee9d2882f3" />

Sistema de propuestas para añadir nuevas tareas. Una tarea solo se incorpora si todos los miembros votan a favor. Las propuestas sin votos expiran a los 7 días.

### Coordinación de mascotas

<img width="480" height="241" alt="output" src="https://github.com/user-attachments/assets/17ff0440-a87a-44cf-bd47-725fde18f634" />

Pestaña para gestionar los turnos de comida. Soporta múltiples mascotas y permite registrar quién les dio de comer y cuándo. Incluye un sistema de trueques para que los miembros puedan intercambiar turnos si alguien no puede cubrir el suyo.

### Personalización y notificaciones

<img width="480" height="241" alt="output" src="https://github.com/user-attachments/assets/73e7bc9b-6060-4a14-957a-3a2d5ed85d8a" /> 

Cada miembro tiene un color identificativo. Existe un sistema de agradecimientos y notificaciones para estar al tanto de las tareas completadas y solicitudes de intercambio.

<img width="456" height="964" alt="imagen" src="https://github.com/user-attachments/assets/c0571025-8b96-473c-bb92-4608a9bec399" />

## Requisitos

- Node.js / Bun
- Instancia de Supabase

## Configuración inicial

Al iniciar la aplicación por primera vez, un asistente de configuración te guiará para:
1. Crear los miembros de la casa.
2. Configurar la lista inicial de tareas.
3. Configurar las mascotas si las hay.

## Instalación local

Clona el repositorio e instala las dependencias:

```bash
bun install
```

Crea un archivo `.env.local` con tus credenciales:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
HOME_PASSWORD=contraseña_de_acceso
```

Inicia el servidor:

```bash
bunx next dev
```

## TODOS / Pendientes

- [ ] Pasar la funcionalidad de coordinar horarios para otras tareas.
- [ ] Añadir asistente de configuración para la primera database creada.
- [ ] Clarificar el readme de configuración.

## Ideas (QoL)

### 🔵 Marcar como alimentado desde el TodayCard
Un long-press o doble tap en la tarjeta de hoy que pregunte "¿Alimentaste a {mascota}?" para evitar abrir el modal. Reutiliza `isSlotToday` e `isCurrentUserAssigned`.

### 🔵 Recordatorios push cuando es tu turno de mascota
Disparar una notificación push cuando se acerca la ventana del slot asignado. Ya existe `pushUtils.ts` y el sistema de turnos en `feeding_slots.assigned_to`.

### 🔵 Snackbar "Deshacer" al completar una tarea
Mostrar un toast "Tarea registrada ✓ — Deshacer" con timeout de 5s después de confirmar un chore, para evitar ir a Actividad Reciente a borrar.

### 🔵 Resumen diario en el home
Banner que muestre "Hoy es tu turno de ☀️ dar comida a Otelo" o "🔴 3 tareas atrasadas". Consolidar datos de `ChoreGrid` y la sección Mascotas.

### 🔵 Favoritos (fijar chores al inicio)
Toggle de estrella en cada chore para fijarlo al principio de su categoría. Estado persistente con zustand.

### 🟡 Feed de actividad de mascotas
Mini timeline que muestre quién alimentó y cuándo en los últimos días, usando `feeding_slots.fed_at` + `fed_by`.

### 🟡 Notificación al asignado cuando alguien cubre su turno
Si alguien marca como alimentado un turno ajeno (reemplazo amarillo), avisar al asignado original vía push con `targetMemberId`.

### 🟡 Calendario mensual de alimentación
Toggle a vista mensual además del grid semanal para ver patrones de quién alimenta cada día.

### 🟡 Meta semanal personal
En `SummaryCard`, permitir setear "Mi meta: X tareas/semana" y mostrar progreso. Guardar en `members.notification_prefs` (JSONB).

### 🟡 Leaderboard semanal
Mini ranking "Esta semana": 🥇 Diego (8) 🥈 Luis (5) 🥉 Josefa (3). Misma data que `WeeklySummaryBanner`.

### 🔴 Notas al completar tarea
Campo opcional en `ConfirmChoreModal` para agregar contexto (ej: "compré detergente"). Requiere columna extra en `logs`.

### 🔴 Gamificación: logros/insignias
"Racha de 7 días 🌟", "Apaga incendios (5 reemplazos) 🔥", "Madrugador 🐦". Del lado cliente sobre `logs` y `feeding_slots`.

### 🔴 Dashboard de equidad
Gráficos comparativos de carga: quién hace más vs menos, reemplazos, cumplimiento de turnos de mascotas. Para la página de estadísticas.
