# Otelo - App de Tareas del Hogar

Una aplicación web mobile-first para registrar las tareas del hogar, diseñada para la familia. Creada con Next.js 16, Tailwind CSS, Recharts y Supabase.

**Advertencia: *Software hecho con IA con el propósito de solucionar y aprender / Software made with AI for learning and solution purposes***

<img width="1434" height="921" alt="image" src="https://github.com/user-attachments/assets/8e61b220-3ee0-466a-a312-33bc9b7d34c5" />

## ✨ Características Principales

### 🏠 Dashboard Inteligente
- **Organización por Categorías:** Las tareas se agrupan automáticamente (Cocina, Limpieza, Mascotas, etc.).
- **Detector de Tareas Pendientes:** Sistema visual que avisa si una tarea lleva mucho tiempo sin hacerse (umbrales personalizados de 3, 7 o 30 días).
- **Banner "Estrella de la Semana":** Cada domingo y lunes se celebra al miembro más activo de la semana anterior.
- **Rachas de Actividad:** Indicadores de días seguidos aportando a la casa.

### 🗳️ Consejo Familiar
- **Democracia Directa:** Sistema de propuestas para añadir nuevas tareas.
- **Votación Unánime:** Una tarea solo se añade al grid oficial cuando **todos** los miembros de la familia votan a favor.
- **Selector de Emojis:** Integración de un selector de emojis estilo Notion para personalizar las propuestas.
- **Expiración Automática:** Las propuestas no votadas desaparecen tras 7 días para mantener el orden.

### 🎨 Personalización y Perfil
- **Identidad Visual Única:** Paleta de 10 colores vibrantes con **exclusividad garantizada** (no puede haber dos personas con el mismo color).
- **Intercambio de Colores (Color Trade):** Sistema para solicitar el color de otro miembro. Si el otro acepta, los colores se intercambian automáticamente.
- **Notificaciones Integradas:** Centro de notificaciones para ver agradecimientos y solicitudes de intercambio.

### 🛡️ Seguridad y Rendimiento
- **Auth Invisible (JWT):** Sesiones seguras mediante tokens JWT firmados por el servidor, manteniendo una duración de 1 año para evitar re-logueos constantes.
- **Modo Oscuro Nativo:** Interfaz consistente en todos los componentes y gráficos.
- **Mobile-First:** Diseñada para usarse como una App (PWA) en teléfonos.

## 🛠️ Requisitos Previos

- [Node.js](https://nodejs.org/) (o Bun) instalado.
- Cuenta en [Supabase](https://supabase.com/).

## ⚙️ Configuración de Supabase

1. Crea un nuevo proyecto en Supabase.
2. Ve a **SQL Editor** en el panel de Supabase.
3. Ejecuta los archivos de migración en orden (`001` al `006`) situados en la carpeta `supabase/migrations/`.
4. Ve a **Project Settings** > **API** y copia el `Project URL` y el `anon public key`.

## 🚀 Instalación Local

1. Clona este repositorio.
2. Instala las dependencias:
   ```bash
   bun install
   ```
   *(o usa `npm install`)*
3. Crea un archivo `.env.local` con tus credenciales de Supabase y una `HOME_PASSWORD`.
4. Inicia el servidor de desarrollo:
   ```bash
   bun run dev
   ```

## 🗺️ Roadmap (Próximamente)

- [ ] **Soporte para PWA total:** Para instalación nativa con un clic en iOS/Android.
- [ ] **Página de administración**: Panel para gestionar miembros y ver logs detallados.
- [ ] **Soporte para Docker**: Facilitar el despliegue en NAS o Raspberry Pi.
- [ ] **Notificaciones Push**: Avisos directos al móvil cuando alguien solicita un intercambio o te agradece.
