---
name: "Retomar Proyecto"
description: "Protocolo obligatorio al iniciar una nueva sesión para continuar exactamente donde se quedó la sesión anterior."
---

# 🚀 Protocolo de Retorno de Proyecto (Resume Workflow)

Al empezar cualquier nueva conversación o sesión de trabajo en este repositorio, el agente **DEBE OBEDECER** las siguientes instrucciones antes de realizar ninguna modificación de código:

## 1. 📖 Leer el Historial Inmediato
Tu primer paso debe ser acceder a dos archivos críticos que conforman la "memoria" del equipo y el estado actual:
- Usa `view_file` para leer `CHANGELOG.md` y entender la situación actual, la fase del proyecto, flujos completados y tareas pendientes.
- Usa `view_file` para leer `COLLABORATION.md` y refrescar el protocolo para integraciones, commits y estructura.

## 2. 🔍 Verificar Reportes Recientes
Si existen archivos con terminación `.md` relevantes en la carpeta del repositorio sobre problemas sin resolver (como `google_oauth_bug.md` o reportes en `/docs`), léelos. El agente anterior pudo haber dejado instrucciones o hallazgos.

## 3. 🎯 Identificar el Bloqueo Actual
Busca de forma proactiva cuál fue el último escollo de la sesión anterior. Generalmente la lista de "Pendientes / Próximos pasos sugeridos" está al principio o al final del `CHANGELOG.md`.

## 4. ✋ Confirmar con el Usuario
Una vez tengas el contexto completo, resume en 2-3 líneas dónde nos quedamos y propón directamente atacar la primera tarea pendiente de la lista o resolver el *bug* documentado. No pidas contexto general, el contexto lo dicta el `CHANGELOG.md`.

---
> **Objetivo de este Skill**: Evitar perder tiempo inicial, ser proactivos, mantener consistencia y no perder el rastro de bugs o *features* en proceso entre sesiones diferentes.
