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

## 🚀 Áreas de Enfoque Actual
- **Antigravity:** Despliegue en producción (Vercel) y estabilidad de la base de datos local.
- **Manus:** Refactorización de lógica de negocio y optimización de integraciones externas.

## ⚠️ Reglas Críticas
- **NO subir el archivo `.env`:** Seguir siempre el formato de `.env.example`.
- **Limpieza:** Borrar los scripts de prueba temporales antes de hacer push, a menos que sean útiles para el futuro.

---
*Este documento es una guía viva para asegurar que el código de CITALIKS sea siempre robusto y escalable.*
