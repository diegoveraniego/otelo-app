# Otelo - App de Tareas del Hogar

Una aplicación web mobile-first para registrar las tareas del hogar, diseñada para la familia. Creada con Next.js 14, Tailwind CSS, Recharts y Supabase.

<img width="1434" height="921" alt="image" src="https://github.com/user-attachments/assets/8e61b220-3ee0-466a-a312-33bc9b7d34c5" />
<img width="1420" height="910" alt="image" src="https://github.com/user-attachments/assets/47b653ee-cf35-4655-a6b0-2fc19fa08fb6" />
<img width="1423" height="920" alt="image" src="https://github.com/user-attachments/assets/7058f11f-efe3-4245-a41f-bce028a12e6f" />



Advertencia: *Hecho con IA con el propósito de solucionar y aprender / Made with AI for learning and solution purposes*

[Videocaptura de pantalla_20260504_124347.webm](https://github.com/user-attachments/assets/82932b62-64ea-4c05-9832-130fd242ccb6)

## Requisitos Previos

- [Node.js](https://nodejs.org/) (o Bun) instalado.
- Cuenta en [Supabase](https://supabase.com/).

## Configuración de Supabase

1. Crea un nuevo proyecto en Supabase.
2. Ve a **SQL Editor** en el panel de Supabase.
3. Copia el contenido de `supabase/migrations/001_init.sql` y ejecútalo para crear las tablas y datos iniciales (miembros de la familia y tareas).
4. Ve a **Project Settings** > **API** y copia el `Project URL` y el `anon public key`.

## Instalación Local

1. Clona este repositorio (si aplica) o navega a la carpeta.
2. Instala las dependencias:
   ```bash
   bun install
   ```
   *(o usa `npm install`)*
3. Crea un archivo `.env.local` en la raíz del proyecto y añade las siguientes variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   HOME_PASSWORD=una-contrasena-segura
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   bun run dev
   ```
   *(o usa `npm run dev`)*
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en Vercel

1. Sube tu proyecto a un repositorio de GitHub.
2. Inicia sesión en [Vercel](https://vercel.com/) y crea un nuevo proyecto desde tu repositorio.
3. En la sección de **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `HOME_PASSWORD`
4. Haz clic en **Deploy**. ¡Tu aplicación estará lista en minutos!

## Uso

- **Contraseña de Casa**: Al ingresar, se te pedirá la contraseña de casa definida en `HOME_PASSWORD`.
- **PIN de Usuario**: Al seleccionar tu nombre, ingresa el PIN de 4 dígitos configurado en la base de datos (puedes ver o cambiar los PINs en `supabase/migrations/001_init.sql`).
- **Registrar Tareas**: Toca una tarea en la pantalla de inicio y confirma. Si registras la misma tarea dos veces en menos de una hora, la app te avisará.
- **Estadísticas**: Revisa la actividad semanal, mensual y anual en la pestaña de Estadísticas.

## Roadmap (Próximamente)

- [ ] **Página de administración**: Panel para gestionar miembros, tareas y ver logs detallados.
- [ ] **Soporte para Docker**: Facilitar el despliegue en servidores hogareños (Home Servers, NAS, Raspberry Pi).
- [ ] **App Nativa Android**: Desarrollar una versión para Android con notificaciones push.
- [ ] **App Nativa iOS**: Desarrollar una versión para iOS.
