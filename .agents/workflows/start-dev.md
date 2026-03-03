---
description: Cómo arrancar el sistema de desarrollo de CitaLiks (Next.js + ngrok) correctamente para que las llamadas telefónicas funcionen
---

# Arranque del servidor de desarrollo

// turbo-all

## Pasos

1. Asegúrate de que el servidor Next.js está corriendo en el puerto 3003:
```
npm run dev
```

2. Inicia ngrok con la opción `--host-header=rewrite` (OBLIGATORIO para que Retell funcione con llamadas telefónicas):
// turbo
```
ngrok http 3003 --domain=philanthropistic-verbosely-lu.ngrok-free.dev --host-header=rewrite
```

> **IMPORTANTE**: Sin `--host-header=rewrite`, ngrok muestra una página HTML de aviso a las peticiones de Retell en lugar de pasarlas al servidor. Esto hace que el bot diga "problema técnico" al intentar consultar la agenda por teléfono.

3. Verifica que ngrok está funcionando correctamente accediendo a http://localhost:4040 y comprobando que hay un tunnel activo hacia localhost:3003.
