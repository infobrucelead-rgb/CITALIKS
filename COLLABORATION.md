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
