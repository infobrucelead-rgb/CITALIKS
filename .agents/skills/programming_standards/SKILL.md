---
name: Estándares de Programación CitaLiks
description: Convenciones de arquitectura, dependencias y reglas de integración de base de datos para proyectos del ecosistema.
---

# Estándares de Programación CitaLiks

## 1. Stack Tecnológico General
*   **Frontend y Backend Unificado:** `Next.js` (App Router) en `TypeScript`. Servimos componentes modernos (Server Components por defecto) y "use client" sólo donde se precise interactividad stateful real.
*   **Base de Datos:** `Prisma ORM` sobre `PostgreSQL`. 
*   **Autenticación y Sesiones:** `Clerk NextJS`. Integración robusta; los middlewares limitan o redirigen el acceso protegiendo APIs críticas sin comprometer URLs públicas (como webhooks de Retell).

## 2. Flexibilidad Arquitectónica
*   **Base de Datos sobre Env Vars:** Nunca añadir credenciales operacionales estáticas (`GOOGLE_REDIRECT_URL`, `DEMO_AGENT_ID`, etc.) al `.env` que puedan romper el Front-end en producción.
    *   **Regla de Oro:** Transformar siempre esas claves en *campos de base de datos de un usuario "Master Admin"*. Que CitaLiks consuma la API buscando en la BBDD el valor deseado de la cuenta Admin en tiempo real.
*   **Integración CRM Universal y Bidireccional:** El Agent AI (Retell o vLLMs) siempre reporta vía *Webhook* a endpoints nuestros (ej. `/api/retell/webhook`), y nosotros empujamos esa info mediante herramientas No-Code (Zapier/Make) o iCal para garantizar bidireccionalidad extrema.

## 3. Interfaces Dinámicas
*   Todo panel de Cliente debe prever un Panel "Espejo" de Administrador donde el Creador (Pablo) pueda sobreescribir variables (eMail, RetellAgentID, Webhooks) saltándose la UI del cliente final. Los campos profundos de los clientes deben estar bloqueados visualmente (read-only) con explicaciones claras de por qué lo están.

## 4. Gestión de Precios y Pagos
*   **Fuente Única de Verdad (`src/config/pricing.ts`):** Todos los planes comerciales, descripciones, precios recurrentes, costes de instalación (setup) y las IDs correspondientes de Stripe deben modificarse **únicamente** en este archivo.
*   Ningún componente frontend (como la *Landing Page*) ni función backend (creación de checkouts, enlaces de cobro, respuestas del chatbot) debe tener precios o nombres de planes hardcodeados. Todo debe importar y consumir el array `PRICING_PLANS`.
