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
