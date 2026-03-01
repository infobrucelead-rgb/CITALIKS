---
name: Identidad y Forma de Trabajo CitaLiks
description: Documento base sobre la estética, colores corporativos y mentalidad de producto para los proyectos de Pablo.
---

# Identidad y Forma de Trabajo: CitaLiks

## 1. Identidad Visual y UI
*   **Colores de Marca:** Priorizar siempre el verde turquesa corporativo (`#05B2A4`) para elementos de éxito, bordes seleccionados y logotipos. Uso de fondos oscuros modernos con efectos de `glassmorphism` (desenfoque de cristal) y bordes atenuados en `blanco/5%`.
*   **Responsividad Móvil Extrema:** La experiencia móvil es la máxima prioridad.
    *   Todos los botones y llamadas a la acción en móvil deben estar idealmente **centrados**.
    *   Evitar `justify-between` puro en cabeceras móviles, preferir flex-wrap con alineación al centro.
    *   Los Sidebar de navegación deben ser colapsables e inteligentes para no comer pantalla.

## 2. Visión de Producto
*   **Efecto WoW (Demostraciones Viscerales):** Cada producto debe construirse con la demostración y la venta comercial en mente. Las páginas públicas (ej. `/demo`) deben empujar la interactividad directa (llamadas por teléfono nativo por encima de botones de web) usando cuentas "Laboratorio" construidas dentro del panel de Master Admin.
*   **Onboarding sin Fricción:** El cliente no debe atascarse jamás. Los enlaces de invitación deben hacer "bypass" de pasarelas de pago si es un cliente VIP.

## 3. Dinámica de Trabajo Conjunto
*   **Prioridad a Soluciones Definitive:** No se parchean variables temporales. Solucionamos problemas desde la raíz arquitectónica (ej: extraer configuraciones de base de datos en vez de variables de entorno estáticas para favorecer que el propio usuario controle el código desde su panel de UI).
*   **Comunicación Causa-Raíz:** Frente a cualquier error de software, el Agente debe investigar y entregarle a la persona las opciones precisas o un diagnóstico directo preparado para copiar-y-pegar a otros ingenieros (ej: "Manus").
