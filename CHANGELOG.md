# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **SMS Reminder System (via Netelip)**
  - New service `src/lib/sms.ts` to send SMS messages using Netelip API v1.0.
  - Automatic confirmation SMS sent when a booking is made (`book_appointment`).
  - Automatic cancellation SMS sent when an appointment is cancelled (`cancel_appointment`).
  - New cron endpoint `src/app/api/sms/reminders/route.ts` to send reminder SMS 3 hours before the appointment.
  - Configuration for Vercel Cron (`vercel.json`) and a fallback script for external cron jobs (`scripts/trigger-sms-reminders.sh`).
  - New fields in `Appointment` model (`smsConfirmationSent`, `smsReminderSent`, etc.) to track SMS status. Includes a manual SQL migration file.
  - Retell agent prompt updated to inform users about SMS confirmations and reminders.
  - New `CRON_SECRET` environment variable to protect the reminders endpoint.

### Fixed
- Retell agent prompt no longer mentions "CITALIKS" when informing the customer about SMS confirmation. The bot now says "Te llegará un SMS de confirmación" without revealing the platform brand. This is important for white-label deployments.

### Changed
- `COLLABORATION.md` updated to include `CHANGELOG.md` as the official protocol for asynchronous communication between AIs.

### Known Issues
- Netelip SMS account has insufficient balance (HTTP 402). SMS sending will work correctly once the account is topped up. The token has been verified as valid. The correct token must be set as `NETELIP_API_TOKEN` in the production environment variables.

---

## [2026-02-26b] — Panel Admin Refactorizado

### Modified
- **`src/app/dashboard/admin/AdminDashboardContent.tsx`** — Reescritura completa del panel de administración:
  - Búsqueda funcional de clientes por nombre, email o teléfono
  - Paginación de 10 clientes por página con navegación
  - Edición inline de campos clave (nombre negocio, teléfono bot, teléfono desvío, nombre agente, tono, calendario)
  - Modal de detalle con 3 pestañas: **Configuración** / **Actividad** / **Citas**
  - Botón "Actualizar Agente" para regenerar el prompt de Retell desde admin sin tocar código
  - Pestaña global de **Citas** con filtros (todas / confirmadas / canceladas)
  - Indicadores visuales de estado SMS por cita (confirmación + recordatorio)
  - Cancelación de citas directamente desde el panel admin
  - Toast notifications para todas las acciones
  - Métricas globales: total clientes, llamadas, agentes Retell, arquitectura BD
  - Badges de infraestructura (Dedicated DB / Shared DB / Agent Linked)

### Added
- **`src/app/api/admin/appointments/route.ts`** (nuevo endpoint):
  - `GET /api/admin/appointments` — listar citas (todas o por `?clientId=`), incluye datos del negocio
  - `PATCH /api/admin/appointments` — actualizar estado/notas de una cita
  - `DELETE /api/admin/appointments` — eliminar cita permanentemente
- **`src/app/api/admin/update-agent/route.ts`** (nuevo endpoint):
  - `POST /api/admin/update-agent` — regenerar prompt del agente Retell para cualquier cliente
  - Carga automáticamente servicios y horarios actuales del cliente antes de regenerar

