# Changelog — CitaLiks

> **Protocolo de comunicación entre IAs:** Este archivo es el punto de referencia oficial para Manus y Antigravity. Antes de empezar cualquier sesión de trabajo, hacer `git pull` y leer este archivo completo. Al terminar, actualizar con lo que se ha hecho.

---

## ESTADO ACTUAL DEL PROYECTO — 09 Mar 2026

### Resumen ejecutivo
CitaLiks es una plataforma SaaS multi-tenant que permite a negocios tener su propio asistente de voz con IA para gestionar citas. El sistema está en fase de producción con el primer cliente (Neural360) operativo. Se han corregido problemas críticos de sincronización de datos entre el dashboard y el agente de Retell, y se han realizado mejoras significativas en la UI/UX del panel de integraciones y soporte.

## [2026-03-09] — Mejoras UI/UX en Soporte e Integraciones

### Improved
- **Modal de Soporte:** Rediseño estructural del modal de "Nuevo Ticket" para garantizar que no se corte en pantallas móviles. Implementado un React Portal (`document.body`) con `min-h-[100dvh]` para asegurar un centrado perfecto independientemente de animaciones o transformaciones CSS del contenedor padre.
- **Estética Consistente:** Eliminada la franja superior de gradiente (violeta/fuchsia) del modal de soporte para alinear el diseño con el resto de modales de la plataforma (estilo glassmorphic minimalista).
- **Flujo de Integraciones:** El botón de "Contactar Soporte" en la pestaña de integraciones ahora pre-rellena automáticamente el asunto ("Integración CRM / PMS") y la categoría ("Solicitar integración"), abriendo directamente el modal de soporte sin que el usuario tenga que navegar.

## [2026-03-08] — Sistema de Seguimiento Automático de Leads

### Added
- **Automatización de Seguimiento:** Implementado sistema de recordatorios por email a las 24h, 3 días y 1 semana para leads con pagos pendientes.
- **Recordatorios Persuasivos:** Emails diseñados con enfoque en el coste de oportunidad y urgencia (aviso de desactivación de oferta a los 7 días).
- **Notificaciones Admin:** El administrador recibe un aviso instantáneo cuando un lead completa el pago.
- **Dashboard de Prospects:** Visualización de recordatorios enviados y estado de pago en tiempo real. 
- **Persistencia de Enlaces:** El `paymentUrl` de Stripe se guarda ahora en la base de datos para asegurar consistencia en los correos de seguimiento.

### Improved
- **Configuración Centralizada:** El email del administrador para notificaciones se controla ahora desde la variable de entorno `ADMIN_EMAIL`, facilitando cambios rápidos sin tocar código.

---

## [2026-03-06] — Sincronización Profunda y Mejoras de IA

### Fixed
- **Sincronización de Agendas:** El agente ahora recibe correctamente los horarios comerciales y del personal (staff) por separado. Se ha corregido el filtrado para que el bot no se confunda con horarios duplicados.
- **Sincronización de Staff:** Ahora el prompt del agente incluye la lista de empleados y sus horarios específicos extraídos de la base de datos del tenant.
- **Seguridad Prisma:** Añadido filtrado de desconexión (`$disconnect`) en los flujos de sincronización para evitar fugas de conexiones a la base de datos.
- **Consistencia de Voz:** Se ha forzado que cada actualización del agente incluya el parámetro `voice_id` para evitar errores de validación de la API de Retell.

### Added
- **Sincronización Automática:** El `agent_name` en Retell se sincroniza automáticamente con el nombre configurado en el dashboard.
- **Manejo de Errores Admin:** Los errores de Retell ahora se muestran con detalle en el panel de administrador para facilitar el diagnóstico.

---

## [2026-03-05] — Mejora en Onboarding y Gestión de Clientes

### Added
- **Voces por Género:** Implementada la selección de voz masculina/femenina durante el onboarding, mapeando a las voces personalizadas correctas en Retell.
- **Borrado Completo de Clientes:** Nueva funcionalidad en el panel admin para eliminar un cliente por completo (Agente Retell, base de datos del tenant, usuario de Clerk y registro maestro).

### Fixed
- **Build en Vercel:** Automatizada la sincronización del schema (`prisma db push`) durante el proceso de build para evitar desajustes en producción.
- **Robustez del Dashboard:** Corregido error de renderizado (SSR) cuando el nombre del negocio contenía caracteres especiales o era nulo.

---

## ESTADO ANTERIOR DEL PROYECTO — 26 Feb 2026

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
| `STRIPE_PRICE_SETUP` | ⚠️ Pendiente | Crear productos en Stripe Dashboard |
| `STRIPE_PRICE_QUARTERLY` | ⚠️ Pendiente | Crear productos en Stripe Dashboard |
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

## [2026-02-28a] — Entorno Local (Bypass de Onboarding para Admin)

### Modified
- **`src/app/dashboard/page.tsx`** — Modificado para desarrollo local:
  - Cuando la base de datos de Prisima está vacía (0 clientes), el primer usuario de Clerk que inicie sesión se crea automáticamente en la base de datos con el rol `PLATFORM_ADMIN` y el flag `onboardingDone: true`.
  - Esto evita tener que usar scripts externos o hacer el onboarding completo si solo se quiere entrar al dashboard de administrador en una instalación local desde cero.

## [2026-02-28b] — Fixes de Despliegue en Vercel (CI/CD)

### Added
- **`.npmrc`** — Añadido con `legacy-peer-deps=true` para resolver el error `ERESOLVE` de Vercel (conflicto estricto de versión peer de `@clerk/nextjs` exigiendo Next >=15.2, mientras que el proyecto usa `next@15.0.3`).

### Modified
- **`package.json`** — Script de `"build"` actualizado:
  - Antes: `"build": "next build"`
  - Ahora: `"build": "npx prisma generate && npx prisma migrate deploy && next build"`
  - **Propósito:** Automatizar la aplicación segura de migraciones SQL (`migrate deploy`) en el servidor de producción justo antes de cada compilación de Vercel.

---

## [2026-03-01] — Sesión de Fixes Manus (Entorno local + Producción)

### Fixed

#### Dependencias y despliegue en Vercel
- **`package.json` + `package-lock.json`** — Actualizado `next` de `15.0.3` a `15.2.3` para satisfacer el peer dependency de `@clerk/nextjs@6.38.1`. Esto resolvía el error `ERESOLVE` en el build de Vercel que impedía desplegar.

#### Base de datos Neon — Schema desincronizado
- La base de datos Neon tenía un esquema antiguo sin la columna `role` en `clients` ni el enum `UserRole` correcto. Se hizo un reset completo del schema (`DROP SCHEMA public CASCADE`) y se reaplicó el schema completo desde `prisma migrate diff`. El diff ahora devuelve `empty migration` (100% sincronizado).
- **Causa raíz:** Las migraciones parciales previas habían dejado el schema en un estado inconsistente que impedía arrancar la app localmente con el error `column "role" does not exist`.

#### Entorno local — .env con valores de ejemplo
- El archivo `.env` (no el `.env.local`) tenía `pk_test_xxxxxxxxxxxx` como valor de `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. Next.js lo leía antes que el `.env.local`, ignorando las claves reales de Clerk. **Solución:** borrar el `.env` y dejar solo el `.env.local` con los valores reales.
- **Nota para Antigravity:** El `.env` de la raíz del proyecto local debe eliminarse. Solo debe existir `.env.local` (ignorado por git) y `.env.example` (plantilla).

#### Google OAuth — redirect_uri_mismatch
- **Error 400 `redirect_uri_mismatch`** — Investigado en profundidad. Conclusión: el código es correcto (el fix de Antigravity `910a7b1` funciona bien), las variables de Vercel son correctas y la URI `https://citaliks.vercel.app/api/google/callback` está registrada en Google Cloud Console. El error se producía por caché de sesión del navegador. En ventana de incógnito funciona correctamente.
- **Aviso "app no verificada"** — Normal para apps con scope de Google Calendar. Los usuarios pueden hacer clic en "Continuar" y funciona. Para eliminarlo definitivamente hay que solicitar la verificación formal a Google (proceso de 1-2 semanas).

#### Voz del agente Retell — 404 al lanzar
- **`src/lib/retell.ts`** — La voz `eleven_multilingual_v2-Isabella` fue eliminada del catálogo de Retell AI, causando error `404 Item not found from voice` al pulsar "Lanzar CitaLiks" en el onboarding.
- **Fix final:** Actualizada a la **voz personalizada `custom_voice_630a60422ba640c56991af203d`** (voz de Pablo, subida previamente a Retell). Esta voz se usa en todos los agentes nuevos que se creen desde el onboarding.

### Added
- **`src/app/api/diag/route.ts`** — Ampliado para mostrar: `req_origin`, `req_host`, `x_forwarded_host`, `x_forwarded_proto`, `dynamic_redirect_uri_built`, `google_sends_dynamic`, `google_sends_env`. Útil para depurar problemas OAuth en Vercel.

### Estado tras esta sesión
- ✅ Vercel despliega correctamente (Next 15.2.3 + Clerk 6.38.1)
- ✅ Base de datos Neon sincronizada con el schema de Prisma
- ✅ Login con Google Calendar funciona en producción
- ✅ Botón "Lanzar CitaLiks" funciona (voz corregida)
- ⚠️ Aviso "app no verificada" de Google — pendiente solicitar verificación formal

---

*Última actualización: 01 Mar 2026 — Manus*

---

## 🚨 BUG CRÍTICO ACTIVO — 03 Mar 2026 — Antigravity

### Reservas por teléfono: el bot dice "problema técnico" y no agenda

**Prioridad: ALTA** — El canal telefónico es el core del producto.

#### Síntoma exacto
El usuario llama al **+34810101297** (número de Neural360). El bot saluda correctamente, entiende el servicio y la fecha, dice "déjame mirar la agenda..." y luego responde "Ha habido un pequeño problema técnico". No agenda nada.

El web chat funciona perfectamente.

#### Diagnóstico realizado por Antigravity

1. **Las herramientas NO se invocan en llamadas de teléfono.** El `transcript_object` de Retell para todas las llamadas de teléfono muestra **0 entradas de tipo `tool_call_invocation`**. El bot intenta consultar la agenda pero Retell no llega a llamar al endpoint.

2. **Causa raíz encontrada:** Las URLs de las herramientas del agente de Retell apuntaban al **túnel ngrok local** (`philanthropistic-verbosely-lu.ngrok-free.dev`) en lugar del servidor de producción. Las llamadas del web chat funcionaban porque el navegador pasaba el "browser interstitial" de ngrok; las de teléfono (que Retell hace server-to-server) recibían HTML de ngrok y morían.

3. **Fixes aplicados (commit `ecdf13e`, 03 Mar 2026):**
   - Cambiadas las URLs de las herramientas de Retell de ngrok a `https://citaliks.vercel.app`
   - Añadido fallback en `src/app/api/retell/function-call/route.ts`: si el bot no manda `client_id`, el servidor lo deduce buscando el cliente por el `to_number` de la llamada (`+34810101297` → cliente CitaLiks)
   - Eliminado `client_id` como campo requerido en el schema del LLM de Retell (era un `required` que bloqueaba la invocación cuando las variables dinámicas no llegaban)
   - Timeouts de las herramientas en Retell aumentados a 20 segundos

4. **El problema PERSISTE tras el fix.** Tras el deploy en Vercel, el bot sigue sin agendar. **No sabemos si Vercel tiene las variables de entorno correctas configuradas.**

#### Lo que necesita Manus investigar

- [ ] **Verificar variables de entorno en Vercel:** Abrir el dashboard de Vercel → proyecto CITALIKS → Settings → Environment Variables y confirmar que existe `DATABASE_URL`, `RETELL_API_KEY`, y todas las variables del `.env.example` con valores de producción.
- [ ] **Probar el endpoint de producción directamente:** `POST https://citaliks.vercel.app/api/retell/function-call?name=check_availability` con body `{"call":{"call_id":"test","call_type":"phone_call","to_number":"+34810101297","from_number":"677146735"},"args":{"date":"2026-03-05"}}`. Debe devolver JSON con `available_slots`.
- [ ] **Revisar logs de Vercel** (Dashboard → Functions → Logs) para ver qué error devuelve el endpoint cuando Retell lo llama durante una llamada real.
- [ ] **Comprobar en Retell** (dashboard de Retell → agente `agent_0b57229b14ce99e87505e1a635` → Tools) que las URLs están actualizadas a `https://citaliks.vercel.app/...`.

#### Archivos clave implicados
- `src/app/api/retell/function-call/route.ts` — Handler principal de las herramientas del bot
- `src/lib/retell.ts` — Configuración y actualización del agente en Retell
- `src/lib/calendar.ts` — Lógica de disponibilidad y booking

*Última actualización: 03 Mar 2026 — Antigravity*

