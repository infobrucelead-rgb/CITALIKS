---
name: Manejo de Errores y UX CitaLiks
description: Protocolo a seguir para el tratamiento de fallos, bloqueos de usuario y persistencia de sesiones.
---

# Manejo de Errores y Persistencia: CitaLiks

## 1. Persistencia de Estados en Procesos Críticos (Onboarding)
*   **Ataque al problema principal:** Nunca devolver a un usuario al 'Paso 1' de un flujo multi-step si ocurre una falla técnica, un bloqueo OAuth o un cierre de ventana accidental.
*   **Regla de Persistencia:** Acarrear y retener siempre las variables dinámicas de URL (e.g., `?token=XYZ&email=XYZ`) a través de todos los redirects de Error (e.g. `catch(err) { return redirect('/onboarding?token=XYZ&error=true'); }`). Esto mantiene la experiencia de usuario y minimiza la frustración técnica.

## 2. Redirecciones e Integraciones de Terceros (Google/Stripe)
*   **Redirecciones Dinámicas vs Estáticas:** Evitar confiar en variables de entorno tipo `process.env.APP_URL` para componer URI's de retorno a APIs de OAuth. Los entornos Cloud (ej. Vercel) pueden cachear versiones estancadas de la URL (o incluir dominios preview extraños).
*   **Regla de Seguridad de Origen:** Calcular siempre dinámicamente el Base URL utilizando `request.nextUrl.origin` en los métodos Server-Side y pasarlo de forma imperativa a los clientes OAuth.  
```typescript
// Ejemplo de aplicación de regla
const dynamicOrigin = `${req.nextUrl.origin}/api/google/callback`;
exchangeCodeForTokens(code, clientId, dynamicOrigin);
```

## 3. Depradación Agraciada ("Graceful Degradation")
*   La aplicación no debe colapsar completamente (Pantalla Blanca de la Muerte) cuando falla una clave externa. 
*   **Fallback Visual:** Si el usuario no tiene conexión configurada a Retell, Stripe o Google Calendar, la caja principal de esa sección debe mostrar un `Warning`/`Info` con un botón de llamada a la acción ("Añadir Integración Ahora") que lo solucione on-the-spot.
