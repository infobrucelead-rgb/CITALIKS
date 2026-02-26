# Cita Liks — Sistema de Gestión de Citas con IA

Este proyecto es una aplicación web moderna diseñada para automatizar la gestión de citas mediante agentes de voz (IA) e integración con calendarios de Google.

## Stack Tecnológico

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL (vía [Prisma ORM](https://www.prisma.io/))
- **Autenticación:** [Clerk](https://clerk.com/)
- **IA de Voz:** [Retell AI](https://www.retellai.com/)
- **Telefonía:** [Netelip](https://www.netelip.com/)
- **Estilos:** Tailwind CSS + Framer Motion (para animaciones)

## Arquitectura y Módulos

### 1. Gestión de Citas (`src/app/dashboard`)
Panel central donde los usuarios ven sus citas, configuran horarios y gestionan clientes.

### 2. Integración con Google Calendar (`src/lib/google-calendar.ts`)
Sincronización bidireccional de citas para evitar conflictos de horario.

### 3. Agente de Voz (`src/app/api/retell`)
Integración con Retell AI para realizar y recibir llamadas, procesar el lenguaje natural y agendar citas automáticamente en la base de datos.

### 4. Notificaciones
Sistema de avisos por email (SMTP) para confirmar citas con los clientes.

## Estructura de Archivos Principal

- `src/app/`: Rutas y vistas de la aplicación.
- `src/components/`: Componentes UI reutilizables (shadcn/ui).
- `src/lib/`: Utilidades para base de datos, calendario y lógica de negocio.
- `prisma/schema.prisma`: Definición del modelo de datos.
- `scripts/`: Scripts auxiliares de diagnóstico y sincronización de base de datos.

## Guía de Configuración

1. **Instalar dependencias:** `npm install`
2. **Configurar variables de entorno:** Copia `.env.example` a `.env` y rellena las claves.
3. **Migrar base de datos:** `npx prisma db push`
4. **Ejecutar en desarrollo:** `npm run dev`

---
**Nota para IAs Analistas:** Este proyecto utiliza Clerk para la protección de rutas y Prisma para la persistencia. La lógica de agendamiento se encuentra principalmente en los manejadores de eventos de Retell AI.
