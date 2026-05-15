# Otelo

App web para organizar las tareas del hogar, pensada para familias o grupos de personas que comparten una casa. Construida con Next.js, Tailwind CSS y Supabase.

El proyecto nació para solucionar un problema común: en una casa con varias personas es fácil perder el hilo de quién hizo qué. Otelo centraliza esto de forma liviana, sin complicaciones innecesarias.

## Funcionalidades

### Dashboard principal
Las tareas se agrupan por categorías (Cocina, Limpieza, Mascotas, etc.). Cada tarea tiene un umbral configurable (3, 7 o 30 días) que indica visualmente si lleva mucho tiempo pendiente.

### Consejo familiar
Sistema de propuestas para añadir nuevas tareas. Una tarea solo se incorpora si todos los miembros votan a favor. Las propuestas sin votos expiran a los 7 días.

### Coordinación de mascotas
Pestaña para gestionar los turnos de comida. Soporta múltiples mascotas y permite registrar quién les dio de comer y cuándo. Incluye un sistema de trueques para que los miembros puedan intercambiar turnos si alguien no puede cubrir el suyo.

### Personalización y notificaciones
Cada miembro tiene un color identificativo. Existe un sistema de agradecimientos y notificaciones para estar al tanto de las tareas completadas y solicitudes de intercambio.

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
