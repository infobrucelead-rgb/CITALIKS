# Changelog — CitaLiks

> **Protocolo de comunicación entre IAs:** Este archivo es el punto de referencia oficial para Manus y Antigravity. Antes de empezar cualquier sesión de trabajo, hacer `git pull` y leer este archivo completo. Al terminar, actualizar con lo que se ha hecho.

---

## ESTADO ACTUAL DEL PROYECTO — 26 Feb 2026

### Resumen ejecutivo
CitaLiks es una plataforma SaaS multi-tenant que permite a negocios tener su propio asistente de voz con IA para gestionar citas. El sistema está en fase de producción con el primer cliente (Neural360) operativo.

### Arquitectura general
- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript
- **Auth:** Clerk
- **BD:** PostgreSQL + Prisma ORM
- **IA de voz:** Retell AI (agentes + LLMs)
- **Telefonía:** Netelip (números +34)
- **Calendario:** Google Calendar API (OAuth2 por cliente)
- **SMS:** Netelip API SMS (implementado, pendiente activar saldo SMS)
- **Pagos:** Stripe (implementado, pendiente configurar en producción)
- **Email:** SMTP (Nodemailer)
- **Deploy:** Vercel (con cron jobs)

---

### Flujo completo de un cliente nuevo (estado actual)

```
1. PROSPECTO ve la demo en /demo → llama a Sofía (agente demo CitaLiks)
2. ADMIN introduce email+nombre+plan en panel admin → POST /api/admin/send-payment-link
3. PROSPECTO recibe email con enlace Stripe Checkout → paga
4. STRIPE webhook → se envía email de onboarding automáticamente con enlace /sign-up
5. PROSPECTO crea cuenta en Clerk → entra al onboarding
6. ONBOARDING: nombre negocio, tipo, ciudad, servicios, horarios, Google Calendar
7. SISTEMA crea agente Retell + asigna número Netelip automáticamente
8. NEGOCIO operativo: el bot atiende llamadas, reserva citas, envía SMS
```

---

### Variables de entorno — Estado actual

| Variable | Estado | Valor/Notas |
|---|---|---|
| `DATABASE_URL` | ✅ Activo | PostgreSQL en producción |
| `CLERK_SECRET_KEY` | ✅ Activo | — |
| `RETELL_API_KEY` | ✅ Activo | `key_cc895057c5755f73e2dcf27c7119` |
| `RETELL_DEMO_AGENT_ID` | ✅ Creado | `agent_239416dfa79511028e9c9db5e1` — **AÑADIR A PRODUCCIÓN** |
| `NETELIP_API_TOKEN` | ✅ Activo | `6687cdc4b1f996d3577706cf0231bab2eaee2d1cf5ccea35c1b6ecdb3fab6e16` |
| `GOOGLE_CLIENT_ID/SECRET` | ✅ Activo | — |
| `STRIPE_SECRET_KEY` | ⚠️ Pendiente | Cuenta existe, pendiente configurar en producción |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Pendiente | Registrar webhook en Stripe Dashboard |
| `STRIPE_PRICE_MONTHLY` | ⚠️ Pendiente | Crear productos en Stripe Dashboard |
| `STRIPE_PRICE_BIANNUAL` | ⚠️ Pendiente | Crear productos en Stripe Dashboard |
| `STRIPE_PRICE_ANNUAL` | ⚠️ Pendiente | Crear productos en Stripe Dashboard |
| `CRON_SECRET` | ⚠️ Pendiente | Generar con `openssl rand -hex 32` |
| `SMTP_*` | ✅ Activo | Gmail configurado |
| `NEXT_PUBLIC_APP_URL` | ✅ Activo | — |

---

### Migraciones SQL pendientes de aplicar en producción

Ejecutar en orden en la base de datos de producción:

**1. Campos SMS en Appointment** (`prisma/migrations/20260226_add_sms_fields/migration.sql`):
```sql
ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "smsConfirmationSent"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsConfirmationSentAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "smsReminderSent"        BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsReminderSentAt"      TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "smsCancellationSent"    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsCancellationSentAt"  TIMESTAMP;
```

**2. Campos Stripe en Client** (`prisma/migrations/20260226_add_stripe_subscription/migration.sql`):
```sql
ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId"  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "stripePriceId"         TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionPlan"      TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus"    TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS "subscriptionStart"     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "subscriptionEnd"       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "trialEnd"              TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lastPaymentAt"         TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "renewalReminderSent"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "renewalReminderSentAt" TIMESTAMP;
```

**3. Tabla Prospects** (`prisma/migrations/20260226_add_prospects/migration.sql`):
```sql
CREATE TABLE IF NOT EXISTS "prospects" (
  "id"                   TEXT NOT NULL,
  "email"                TEXT NOT NULL,
  "name"                 TEXT NOT NULL,
  "plan"                 TEXT NOT NULL DEFAULT 'biannual',
  "notes"                TEXT,
  "status"               TEXT NOT NULL DEFAULT 'pending',
  "paymentLinkSentAt"    TIMESTAMP(3),
  "paymentLinkSentBy"    TEXT,
  "paidAt"               TIMESTAMP(3),
  "stripeSessionId"      TEXT,
  "onboardingLinkSentAt" TIMESTAMP(3),
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "prospects_email_key" ON "prospects"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "prospects_stripeSessionId_key" ON "prospects"("stripeSessionId");
```

---

### Pendientes / Próximos pasos sugeridos

| Prioridad | Tarea | Notas |
|---|---|---|
| 🔴 Alta | Aplicar las 3 migraciones SQL en producción | Ver sección anterior |
| 🔴 Alta | Añadir `RETELL_DEMO_AGENT_ID` a variables de entorno de producción | `agent_239416dfa79511028e9c9db5e1` |
| 🔴 Alta | Configurar Stripe en producción (productos, webhook, portal) | Ver `[2026-02-26c]` más abajo |
| 🟡 Media | Activar saldo SMS en Netelip (cuenta Neural360) | La API SMS no está contratada — llamar a Netelip o contratar desde el panel |
| 🟡 Media | Añadir formulario de prospectos al panel admin | El endpoint `POST /api/admin/send-payment-link` existe pero no hay UI en el dashboard todavía |
| 🟡 Media | Verificar desvío de llamada a humano | Campo `transferPhone` en el cliente — verificar que está relleno y que Retell lo ejecuta |
| 🟢 Baja | Añadir `CRON_SECRET` y verificar crons de Vercel | SMS reminders + subscription cron |
| 🟢 Baja | WhatsApp Business API | Fase futura — Twilio o Meta API |

---

### Agente demo de CitaLiks — Sofía

- **agent_id:** `agent_239416dfa79511028e9c9db5e1`
- **llm_id:** `llm_9e884559651399a0dd50fbd05c50`
- **Voz:** `cartesia-Sofia` (acento mexicano, femenina)
- **Modelo LLM:** `gpt-4o-mini`
- **Escenario:** Recepcionista de "Clínica Bella" (clínica de estética ficticia)
- **Servicios demo:** Limpieza facial (45€), Tratamiento antiedad (85€), Masaje relajante (55€), Depilación láser (40€)
- **Pitch CitaLiks:** Si el prospecto pregunta cómo funciona, Sofía explica que CitaLiks es la plataforma que la hace funcionar y que cualquier negocio puede tener su propio asistente
- **Backchannel:** Activado ("entiendo", "claro", "perfecto", "por supuesto")
- **Página:** `/demo` (pública, sin login)

---

## [2026-02-26e] — Agente Demo Sofía creado en Retell

### Added
- Agente demo `agent_239416dfa79511028e9c9db5e1` creado directamente via API de Retell
- Voz `cartesia-Sofia` (mexicana, femenina) — la más natural disponible en español
- Prompt mejorado con escenario realista (Clínica Bella) y pitch de CitaLiks al final
- `RETELL_DEMO_AGENT_ID` añadido al `.env.example`

---

## [2026-02-26d] — Flujo Comercial Completo (Demo + Pago + Onboarding)

### Added
- **`src/app/demo/`** — Página pública `/demo` sin login:
  - Llamada web en tiempo real con Sofía (agente demo de CitaLiks)
  - Integración con `retell-client-js-sdk` (web calls desde el navegador)
  - Timer de duración, sugerencias de frases, CTA hacia `/sign-up`
- **`src/app/api/demo/start-call/route.ts`** — `POST`: crea web call con `RETELL_DEMO_AGENT_ID`
- **`src/app/api/admin/send-payment-link/route.ts`** — Envío de enlace de pago a prospectos:
  - `POST`: crea sesión Stripe Checkout + guarda prospecto en BD + envía email HTML
  - `GET`: lista todos los prospectos con su estado
- **`scripts/create-demo-agent.ts`** — Script de referencia para recrear el agente demo
- **`prisma/migrations/20260226_add_prospects/migration.sql`** — Tabla `prospects`

### Modified
- **`prisma/schema.prisma`** — Nuevo modelo `Prospect` + valor `ADMIN` en enum `UserRole`
- **`src/app/api/stripe/webhook/route.ts`** — Nuevo flujo para prospectos nuevos:
  - Si el pago viene de un prospecto (sin `citaliks_client_id`) → actualiza estado a `paid` + envía email de onboarding con enlace `/sign-up?email=...`
  - Template HTML completo con pasos del proceso y diseño CitaLiks

---

## [2026-02-26c] — Sistema de Suscripciones Stripe

### Added
- **`src/lib/stripe.ts`** — Servicio Stripe completo:
  - `getOrCreateStripeCustomer`, `createCheckoutSession`, `createBillingPortalSession`, `constructWebhookEvent`, `extractSubscriptionData`
- **`src/app/api/stripe/checkout/route.ts`** — `POST`: crea sesión de checkout
- **`src/app/api/stripe/portal/route.ts`** — `POST`: genera URL del portal de facturación
- **`src/app/api/stripe/webhook/route.ts`** — Procesa eventos Stripe:
  - `checkout.session.completed` → activa suscripción + email bienvenida
  - `customer.subscription.updated` → sincroniza estado, suspende si `past_due`
  - `customer.subscription.deleted` → cancela + email cancelación
  - `invoice.payment_succeeded` → reactiva cliente
  - `invoice.payment_failed` → suspende + email alerta
- **`src/app/api/stripe/subscription-cron/route.ts`** — Cron diario 08:00:
  - Recordatorio 7 días antes de expirar
  - Suspensión automática al expirar
- **`prisma/migrations/20260226_add_stripe_subscription/migration.sql`**

### Modified
- **`prisma/schema.prisma`** — 11 nuevos campos en `Client` para Stripe
- **`AdminDashboardContent.tsx`** — Nueva pestaña **Suscripción** en modal de cliente
- **`vercel.json`** — Cron diario a las 08:00

### Setup requerido en producción
1. Aplicar migración SQL
2. Crear productos y precios en Stripe Dashboard
3. Registrar webhook: `POST https://tudominio.com/api/stripe/webhook`
4. Añadir variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
5. Activar portal de facturación en Stripe (Billing > Customer portal)

---

## [2026-02-26b] — Panel Admin Refactorizado

### Modified
- **`src/app/dashboard/admin/AdminDashboardContent.tsx`** — Reescritura completa:
  - Búsqueda funcional por nombre, email o teléfono
  - Paginación de 10 clientes por página
  - Edición inline de campos clave
  - Modal de detalle con 4 pestañas: **Configuración** / **Actividad** / **Citas** / **Suscripción**
  - Botón "Actualizar Agente" para regenerar prompt de Retell sin tocar código
  - Pestaña global de **Citas** con filtros y cancelación directa
  - Indicadores SMS por cita
  - Toast notifications

### Added
- **`src/app/api/admin/appointments/route.ts`** — `GET/PATCH/DELETE` citas desde admin
- **`src/app/api/admin/update-agent/route.ts`** — `POST` regenerar agente Retell para cualquier cliente

---

## [2026-02-26a] — Sistema SMS (Netelip)

### Added
- **`src/lib/sms.ts`** — Servicio SMS via Netelip API v1.0
- **`src/app/api/sms/reminders/route.ts`** — Cron cada 30 min: recordatorio 3h antes de cita
- **`src/app/api/sms/send/route.ts`** — Envío manual de SMS (testing/dashboard)
- **`prisma/migrations/20260226_add_sms_fields/migration.sql`** — 6 campos SMS en `Appointment`
- **`vercel.json`** — Cron cada 30 minutos para recordatorios SMS

### Modified
- **`prisma/schema.prisma`** — 6 nuevos campos SMS en modelo `Appointment`
- **`src/app/api/retell/function-call/route.ts`** — SMS de confirmación al reservar + SMS de cancelación
- **`src/lib/retell.ts`** — Prompt actualizado (sin mencionar "CITALIKS")
- **`.env.example`** — `NETELIP_API_TOKEN` + `CRON_SECRET`

### Known Issues
- Netelip SMS: el servicio de API SMS no está contratado en la cuenta Neural360 (HTTP 402). El token es correcto. Hay que contratar el módulo SMS desde el panel de Netelip o llamando al 951 200 000.

---

*Última actualización: 26 Feb 2026 — Manus*
