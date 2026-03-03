# Protocolo de Colaboración Antigravity 🤝 Manus

Este documento define las reglas para que múltiples IAs trabajen de forma segura y eficiente en este repositorio.

## 📌 Flujo de Trabajo

1.  **Sintonía:** Antes de empezar cualquier tarea, la IA debe ejecutar `git pull` para obtener las últimas mejoras.
2.  **Transparencia:** Cada mejora debe ir acompañada de un mensaje de commit descriptivo.
3.  **Verificación:** No se deben subir cambios que no hayan sido probados localmente. Se recomienda crear scripts en `scripts/test-*.ts` para validar la lógica.

## 🛠 Convenciones de Commit

Para que sepamos quién hizo qué y por qué:
- `antigravity: [descripción]` -> Cambios realizados por Antigravity.
- `manus: [descripción]` -> Cambios realizados por Manus.

## 📝 Registro de Cambios (CHANGELOG)

Para mantener una comunicación asíncrona y efectiva, **todos los cambios funcionales deben registrarse en `CHANGELOG.md`**.

- **Formato:** Seguir el estándar de [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
- **Responsabilidad:** La IA que implementa una nueva `feature`, `fix`, o `breaking change` es responsable de añadir la entrada correspondiente al `CHANGELOG.md` en el mismo commit.

## 🚀 Áreas de Enfoque Actual
- **Antigravity:** Despliegue en producción (Vercel), estabilidad de la base de datos y monitorización de los nuevos sistemas (ej. cron de SMS).
- **Manus:** Implementación de nuevas funcionalidades (ej. recordatorios SMS) y optimización de integraciones externas.

## ⚠️ Reglas Críticas
- **NO subir el archivo `.env`:** Seguir siempre el formato de `.env.example`.
- **Limpieza:** Borrar los scripts de prueba temporales antes de hacer push, a menos que sean útiles para el futuro.

---
*Este documento es una guía viva para asegurar que el código de CITALIKS sea siempre robusto y escalable.*

## 🚀 Despliegue Continuo (CI/CD) con Vercel

El despliegue de CitaLiks se gestiona a través de Vercel, conectado directamente a este repositorio de GitHub. Este sistema automatiza el proceso de build y deploy, garantizando estabilidad y facilidad para revertir cambios.

### Flujo de Despliegue

1.  **Desarrollo en Ramas:** Todo nuevo desarrollo se realiza en una rama separada (`feature/...`, `fix/...`).
2.  **Pull Request (PR):** Al crear un PR hacia `master`, Vercel genera automáticamente una **URL de preview** aislada. Esta URL permite probar los cambios en un entorno idéntico a producción sin afectar a los usuarios.
3.  **Revisión y Merge:** Una vez que el PR es revisado y aprobado (y las pruebas en la URL de preview son exitosas), se hace merge a `master`.
4.  **Deploy a Producción:** El merge a `master` dispara automáticamente un nuevo build y deploy en Vercel. Si el build es exitoso, la nueva versión se publica en el dominio de producción.

### Rollbacks

Si un deploy a producción introduce un bug crítico, se puede revertir a cualquier versión anterior con un solo clic desde el **dashboard de Vercel → Deployments → seleccionar un deploy anterior → "Promote to Production"**.

### Comandos clave

- `npm run dev`: Iniciar el servidor de desarrollo local.
- `npm run build`: Compilar la aplicación para producción. Vercel ejecuta esto automáticamente. Es importante ejecutarlo en local antes de hacer push para detectar errores de compilación.
- `npm run start`: Iniciar el servidor de producción localmente (después de un `build` exitoso).

---

## 📋 Notas de sesión — 01 Mar 2026 (Manus)

### Problemas resueltos en esta sesión

1. **Error ERESOLVE en Vercel** — Resuelto actualizando `next` a `15.2.3` en `package.json` y regenerando `package-lock.json`.

2. **Schema Neon desincronizado** — La BD tenía columnas faltantes (`role`, enums). Se hizo reset completo del schema público y se reaplicó desde cero. Ahora `prisma migrate diff` devuelve `empty migration`.

3. **`.env` con valores de ejemplo en local** — El archivo `.env` de la raíz tenía claves falsas (`pk_test_xxxxxxxxxxxx`) que Next.js leía antes que `.env.local`. **Antigravity: asegúrate de que en tu entorno local NO existe el archivo `.env` en la raíz. Solo `.env.local` (con valores reales) y `.env.example` (plantilla).**

4. **Voz Retell `eleven_multilingual_v2-Isabella` eliminada** — Retell AI eliminó esta voz de su catálogo. Actualizada a `custom_voice_630a60422ba640c56991af203d` (voz personalizada de Pablo). Afectaba al botón "Lanzar CitaLiks" en el onboarding con error 404.

5. **Google OAuth `redirect_uri_mismatch`** — El fix `910a7b1` de Antigravity es correcto. El error era caché de navegador. En ventana de incógnito funciona. No requiere cambios de código adicionales.

### Estado actual del proyecto (01 Mar 2026)

| Sistema | Estado |
|---|---|
| Vercel deploy | ✅ Funciona |
| Base de datos Neon | ✅ Sincronizada con schema |
| Auth Clerk | ✅ Funciona |
| Google Calendar OAuth | ✅ Funciona |
| Onboarding completo + Lanzar | ✅ Funciona (voz corregida) |
| SMS Netelip | ⚠️ API SMS no contratada en Neural360 |
| Stripe producción | ⚠️ Pendiente configurar webhook y precios |
| Verificación Google OAuth | ⚠️ Pendiente solicitar a Google (1-2 semanas) |

### Próximos pasos sugeridos para Antigravity

- Solicitar verificación de la app en Google Cloud Console (eliminar aviso "app no verificada")
- Configurar Stripe en producción: webhook + productos + precios
- Contratar módulo SMS en Netelip para activar recordatorios

---

## 🚨 TAREA URGENTE PARA MANUS — 03 Mar 2026

### Bug activo: Reservas por teléfono no funcionan

El bot no puede agendar citas cuando alguien llama al **+34810101297**. Dice "problema técnico" y no agenda nada. El web chat funciona perfectamente.

**Diagnóstico de Antigravity:** El problema era que las URLs de las herramientas del agente Retell apuntaban al túnel ngrok local. Se han actualizado a `https://citaliks.vercel.app` y se ha desplegado el fix (commit `ecdf13e`), pero el bot sigue fallando.

**Sospecha principal:** Las variables de entorno de Vercel pueden no estar configuradas correctamente (especialmente `DATABASE_URL` y `RETELL_API_KEY`).

### Pasos concretos para Manus

1. **Verifica las env vars en Vercel** → Dashboard Vercel → CITALIKS → Settings → Environment Variables. Asegúrate de que están todas las del `.env.example`.

2. **Prueba el endpoint de producción** con curl o Postman:
```bash
curl -X POST https://citaliks.vercel.app/api/retell/function-call?name=check_availability \
  -H "Content-Type: application/json" \
  -d '{"call":{"call_id":"test","call_type":"phone_call","to_number":"+34810101297","from_number":"677146735"},"args":{"date":"2026-03-05"}}'
```
Debe devolver `{"available_slots": [...]}`. Si devuelve error, ese es el problema.

3. **Revisa los logs de Vercel** → Dashboard → Functions → Logs, filtra por los endpoints `/api/retell/function-call`.

4. **Verifica en el dashboard de Retell** (app.retell.ai) que el agente `agent_0b57229b14ce99e87505e1a635` tiene los tools apuntando a `https://citaliks.vercel.app/...` y NO a ngrok.

Ver detalle completo en `CHANGELOG.md` → sección "BUG CRÍTICO ACTIVO — 03 Mar 2026".

