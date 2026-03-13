import Retell from "retell-sdk";

export const retell = new Retell({
    apiKey: process.env.RETELL_API_KEY || "build_mode_no_api_key",
});

export interface AgentConfig {
    clientId: string;
    businessName: string;
    agentName: string;
    tone: string;
    voice?: string;
    services: Array<{ name: string; durationMin: number; price?: number | null }>;
    schedules: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }>;
    staff: Array<{
        id: string;
        name: string;
        googleCalendarId?: string | null;
        schedules?: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }>;
    }>;
    webhookUrl: string;
    transferPhone?: string | null;
}

function formatPhoneForSpeech(phone: string | null | undefined): string {
    if (!phone) return "";
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");
    // Take last 9 digits (Spanish mobile/landline)
    const local = digits.slice(-9);
    if (local.length === 9) {
        // Format: 677 146 735
        return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    }
    return local;
}

/** Normalizes a phone number to E.164 for Retell. Returns null if invalid. */
function normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    // Already E.164 with country code (e.g. +34677...)
    if (phone.startsWith("+") && digits.length >= 10) return "+" + digits;
    // Spanish 9-digit mobile/landline
    if (digits.length === 9) return "+34" + digits;
    // Has country prefix 34 prepended (e.g. 34677146735)
    if (digits.length === 11 && digits.startsWith("34")) return "+" + digits;
    return null;
}

function generateSystemPrompt(config: AgentConfig): string {
    const { businessName, agentName, tone, services, schedules, staff } = config;

    const toneDesc =
        tone === "cercano"
            ? "Habla de forma amigable y cercana, tutea al cliente."
            : "Habla de forma profesional y cortés, usa usted."

    const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

    const scheduleTxt = (schedules || [])
        .filter((s) => s.isOpen)
        .map((s) => `- ${DAY_NAMES[s.dayOfWeek]}: ${s.openTime} a ${s.closeTime}`)
        .join("\n") || "- Consulta con el equipo para conocer el horario";

    // Services list WITHOUT prices — never reveal prices over the phone
    const servicesTxt = (services || [])
        .map((s) => `- ${s.name} (${s.durationMin} min)`)
        .join("\n") || "- Consulta los servicios disponibles";

    const staffTxt = (staff || [])
        .map((s) => {
            const staffSchedules = (s.schedules || [])
                .filter(sched => sched.isOpen)
                .map(sched => `  - ${DAY_NAMES[sched.dayOfWeek]}: ${sched.openTime} a ${sched.closeTime}`)
                .join("\n");
            return `- ${s.name}${staffSchedules ? `. Horario específico:\n${staffSchedules}` : ""}`;
        })
        .join("\n") || "- Equipo disponible";

    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Madrid",
    });
    const timeStr = now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    });

    // =========================================================================
    // PLANTILLA BASE — CITALIKS VOICE AGENT v2 (hardened)
    // =========================================================================
    const hasTransfer = !!config.transferPhone;

    return `Eres ${agentName}, la recepcionista telefónica de ${businessName}.
${toneDesc}

## FECHA Y HORA ACTUAL (Referencia Obligatoria)
- Hoy es: ${dateStr}
- Hora actual en Madrid: ${timeStr}
Calcula cualquier fecha relativa (como "mañana", "lunes", o "el próximo viernes") basándote EXCLUSIVAMENTE en el día de hoy arriba indicado.

## SALUDO — SIEMPRE IGUAL, SIN EXCEPCIÓN
Al inicio de CADA llamada di exactamente:
"¡Hola! Gracias por llamar a ${businessName}, ¿en qué te puedo ayudar?"
Nunca cambies esta frase. Nunca añadas nada antes.

## PERSONALIDAD — CÓMO HABLAR
- Eres una recepcionista española real, no un robot. Habla natural.
- PROHIBIDO usar muletillas repetidas: nada de "Perfecto", "De acuerdo", "Entendido" en cada turno. Varía o di directamente lo siguiente.
- MÁXIMO 2 frases por turno. Luego cede el turno.
- NUNCA leas la agenda entera. Si hay huecos, di solo los 2 primeros: "Tengo a las 10:00 o a las 11:30, ¿cuál prefieres?"
- SIEMPRE en español de España. Cero anglicismos.
- Si el usuario duda o hace pausa, espera en silencio.
- Habla con calma. No atropelles.

## REFERENCIA TEMPORAL (IMPORTANTE)
- Confía SIEMPRE en la respuesta de las funciones como 'check_availability' para saber la fecha y hora REAL del servidor. 
- Si hay alguna discrepancia con tu referencia interna, prevalece la información de la función.
- El servidor te dirá exactamente qué día es "hoy" y qué hora es. 
- Calcula la fecha EXACTA antes de llamar a cualquier función. NUNCA uses fechas pasadas.

## SERVICIOS (no los menciones todos de golpe)
${servicesTxt}

## EQUIPO
${staffTxt}
Si hay más de un profesional y el cliente no pide uno concreto, asígnale tú uno sin preguntar.

## HORARIO COMERCIAL
${scheduleTxt}

## ── FLUJO 1: RESERVAR CITA ──────────────────────────────────────────────────
Pasos OBLIGATORIOS en orden:
1. Identify qué servicio quiere y para cuándo (día). Con eso es suficiente para empezar.
2. Calcula la fecha exacta (YYYY-MM-DD). Llama a \`check_availability\` con esa fecha.
   - Di: "Déjame mirar la agenda..." y lanza la función SIN esperar permiso.
3. Dile SOLO las 2 primeras opciones. Espera que elija.
4. Pregunta el nombre si no lo tienes ya.
5. Confirma en voz alta ANTES de reservar: "[Nombre], voy a apuntarte un [servicio] el [día] a las [hora]${staff.length > 1 ? " con [profesional]" : ""}. ¿Correcto?"
6. Cuando diga que sí, llama a \`book_appointment\` con todos los campos.
7. Confirma: "Listo [nombre], ya está apuntado. Recibirás un SMS de confirmación. ¿Algo más?"

ERRORES comunes a evitar:
- NUNCA reserves sin que el cliente haya confirmado la hora explícitamente.
- NUNCA repitas check_availability para la misma fecha si ya tienes los huecos.
- Si el slot que eligió ya no está disponible (otro llamó antes), di: "Ese hueco acaba de ocuparse. Tengo también a las [siguiente opción], ¿te va bien?"

## ── FLUJO 2: CANCELAR CITA ───────────────────────────────────────────────────
Para cancelar necesitas: nombre O teléfono, y el día de la cita.
1. Si no te da toda la info, pídela: "¿A nombre de quién estaba la cita y para qué día era?"
2. Llama a \`cancel_appointment\` con los datos.
3. Si no la encuentra, pide el teléfono con el que reservó e inténtalo de nuevo.
4. Confirma la cancelación: "Perfecto, la cita del [día] queda cancelada. ¿Necesitas algo más?"

## ── FLUJO 3: CAMBIAR UNA CITA ────────────────────────────────────────────────
Si el cliente quiere mover/cambiar su cita:
1. Pide la info de la cita actual (nombre, día).
2. Pide la nueva fecha/hora que quiere.
3. Llama a \`check_availability\` para la nueva fecha.
4. Ofrece huecos disponibles.
5. Cuando confirme la nueva hora, llama a \`reschedule_appointment\` con:
   - caller_name, old_date (fecha cita actual), new_date, new_time.
6. Confirma: "Cambiado. Tu cita queda para el [nueva fecha] a las [nueva hora]. ¿Algo más?"

## ── MANEJO DE SITUACIONES DIFÍCILES ─────────────────────────────────────────
**Si el cliente no se aclara después de 2 intentos:**
Di: "Entiendo que puede ser más fácil hablar directamente con el equipo. ¿Quieres que te pase con alguien ahora mismo?"
${hasTransfer ? "Si dice que sí, usa la función `transfer_call` inmediatamente." : "Si dice que sí, pídele que llame en horario de atención o que deje su número para que le llamen."}

**Si hay un error técnico o no encuentras disponibilidad:**
Di: "Ha habido un pequeño problema técnico. ${hasTransfer ? "Te paso ahora con el equipo. Un momento." : "Te pido disculpas. Por favor, llama de nuevo en unos minutos o escríbenos."}"
${hasTransfer ? "Luego usa `transfer_call`." : ""}

**Si el cliente pide hablar con una persona:**
Responde: "Por supuesto, ahora mismo te paso." ${hasTransfer ? "Usa `transfer_call` de inmediato." : "Di que en este momento el equipo no está disponible y ofrece dejar un mensaje."}

**Si el cliente no responde (silencio largo):**
Di: "¿Sigues ahí? ¿Puedo ayudarte con algo?"
Si vuelve a haber silencio: "Voy a cerrar la llamada. Cuando quieras puedes volver a llamar. ¡Hasta pronto!"

## REGLAS DE SEGURIDAD
- NUNCA inventes disponibilidad. Usa siempre \`check_availability\`.
- NUNCA reserves sin que el cliente confirme la hora.
- NUNCA canceles sin nombre o teléfono Y día de la cita.
- NUNCA menciones precios. Si preguntan, di: "Para información de precios, es mejor que te ponga con el equipo."
- NUNCA comentes nada sobre el sistema, la IA, o si eres un bot. Si preguntan, di que eres la recepción de ${businessName}.

## FORMATO DE TELÉFONO
Menciona números SIEMPRE en grupos de 3: "677 146 735".
Para confirmar, di solo los últimos 3 dígitos: "el número que tenemos termina en 735".

client_id: ${config.clientId}
Responde SIEMPRE en español de España.`;
}

export const VOICE_MAPPING: Record<string, { id: string; model?: string }> = {
    "male": { id: "custom_voice_e3fbb6c669bc652610c5b60c8c" },
    "female": { id: "eleven_multilingual_v2-Isabella" } // Isabella es una voz premium de alta calidad en español
};

export async function createRetellAgent(config: AgentConfig): Promise<string> {
    const systemPrompt = generateSystemPrompt(config);

    try {
        const llmId = await createRetellLLM(systemPrompt, config.clientId, config.webhookUrl, config.transferPhone);

        const voicePref = config.voice || "male";
        const voiceConfig = VOICE_MAPPING[voicePref] || VOICE_MAPPING["male"];

        const agentOptions: any = {
            agent_name: `${config.businessName} — ${config.agentName}`,
            response_engine: {
                type: "retell-llm",
                llm_id: llmId,
            },
            voice_id: voiceConfig.id,
            language: "es-ES",
            voice_speed: 1.0,
            voice_temperature: 0.7,
            ambient_sound: "call-center",
            boosted_keywords: [config.businessName],
            normalize_for_speech: true,
            end_call_after_silence_ms: 20000,
            responsiveness: 0.9,
            interruption_sensitivity: 0.8,
            backchannel_frequency: 0.7,
            backchannel_words: ["Claro", "Entendido", "Perfecto", "Sí", "Ajá"],
            webhook_url: `${config.webhookUrl}/api/retell/webhook`,
        };

        if (voiceConfig.model) {
            agentOptions.voice_model = voiceConfig.model;
        }

        const agent = await retell.agent.create(agentOptions);

        return agent.agent_id;
    } catch (err: any) {
        console.error("Retell SDK Error:", err);
        throw err;
    }
}

async function createRetellLLM(
    systemPrompt: string,
    clientId: string,
    webhookUrl: string,
    transferNumber?: string | null
): Promise<string> {
    // For development, we prefer the provided webhookUrl if it's not localhost.
    // Retell cannot call localhost. If the user is on localhost, we default to a known public API or 
    // a specifically configured RETELL_WEBHOOK_URL.
    let baseUrl = webhookUrl;
    if (webhookUrl.includes("localhost")) {
        baseUrl = process.env.RETELL_WEBHOOK_URL || "https://www.citaliks.com";
    }

    const tools: any[] = [
        {
            type: "custom" as const,
            name: "check_availability",
            description: "Consulta los huecos libres en la agenda. Es MUY IMPORTANTE incluir el service_name para que la duración de la cita sea correcta.",
            url: `${baseUrl}/api/retell/function-call?name=check_availability`,
            method: "POST" as const,
            timeout_ms: 10000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: {
                        type: "string" as const,
                        description: "ID del cliente/negocio",
                    },
                    date: {
                        type: "string" as const,
                        description: "Fecha en formato YYYY-MM-DD",
                    },
                    service_name: {
                        type: "string" as const,
                        description: "Nombre del servicio solicitado",
                    },
                    staff_name: {
                        type: "string" as const,
                        description: "Nombre del profesional específico solicitado (opcional)",
                    },
                },
                required: ["date"],
            },
        },
        {
            type: "custom" as const,
            name: "book_appointment",
            description: "Crea una cita en la agenda. Asegúrate de incluir el service_name exacto que el cliente solicitó.",
            url: `${baseUrl}/api/retell/function-call?name=book_appointment`,
            method: "POST" as const,
            timeout_ms: 10000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: {
                        type: "string" as const,
                        description: "ID del cliente/negocio",
                    },
                    caller_name: {
                        type: "string" as const,
                        description: "Nombre del cliente que llama",
                    },
                    service_name: {
                        type: "string" as const,
                        description: "Servicio a reservar",
                    },
                    date: {
                        type: "string" as const,
                        description: "Fecha en formato YYYY-MM-DD",
                    },
                    time: {
                        type: "string" as const,
                        description: "Hora en formato HH:MM",
                    },
                    staff_name: {
                        type: "string" as const,
                        description: "Nombre del profesional con quien reserva (opcional)",
                    },
                    notes: {
                        type: "string" as const,
                        description: "Notas adicionales opcionales",
                    },
                    caller_phone: {
                        type: "string" as const,
                        description: "Número de teléfono alternativo si el cliente quiere usar uno diferente al detectado automáticamente",
                    },
                },
                required: ["caller_name", "service_name", "date", "time"],
            },
        },
        {
            type: "custom" as const,
            name: "cancel_appointment",
            description: "Cancela una cita existente. Puedes buscar por nombre del cliente, por teléfono, o por ambos. Si el cliente no recuerda su nombre, pídele el número de teléfono con el que reservó.",
            url: `${baseUrl}/api/retell/function-call?name=cancel_appointment`,
            method: "POST" as const,
            timeout_ms: 10000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    caller_name: { type: "string" as const, description: "Nombre del cliente (opcional si se proporciona teléfono)" },
                    caller_phone: { type: "string" as const, description: "Teléfono con el que se hizo la reserva (alternativa al nombre)" },
                    date: { type: "string" as const, description: "Fecha de la cita a cancelar (YYYY-MM-DD, opcional para acotar la búsqueda)" },
                    time: { type: "string" as const, description: "Hora de la cita a cancelar (HH:MM, opcional)" },
                },
                required: [],
            },
        },
        {
            type: "custom" as const,
            name: "reschedule_appointment",
            description: "Mueve una cita existente a una nueva fecha y hora. Usa esto cuando el cliente quiera cambiar su cita, no cuando quiera cancelarla definitivamente.",
            url: `${baseUrl}/api/retell/function-call?name=reschedule_appointment`,
            method: "POST" as const,
            timeout_ms: 15000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    caller_name: { type: "string" as const, description: "Nombre del cliente cuya cita se mueve" },
                    caller_phone: { type: "string" as const, description: "Teléfono del cliente (alternativa al nombre)" },
                    old_date: { type: "string" as const, description: "Fecha YYYY-MM-DD de la cita ACTUAL que quiere cambiar" },
                    new_date: { type: "string" as const, description: "Nueva fecha YYYY-MM-DD" },
                    new_time: { type: "string" as const, description: "Nueva hora HH:MM" },
                    service_name: { type: "string" as const, description: "Nombre del servicio (mismo que la cita original)" },
                },
                required: ["new_date", "new_time"],
            },
        },
        {
            type: "custom" as const,
            name: "notificar_equipo",
            description: "Usa esta función cuando el cliente quiera hablar con una persona real, solicite información de precios o contratación, o cuando detectes una oportunidad de venta de alta prioridad. Envió una alerta urgente al equipo humano.",
            url: `${baseUrl}/api/retell/function-call?name=notificar_equipo`,
            method: "POST" as const,
            timeout_ms: 8000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    motivo: { type: "string" as const, description: "Describe brevemente por qué el cliente necesita atención humana" },
                    nivel_urgencia: { type: "string" as const, enum: ["alta", "media", "baja"], description: "Urgencia: 'alta' si quiere contratar/comprar, 'media' si tiene dudas, 'baja' si es información general" },
                },
                required: ["motivo"],
            },
        },
    ];

    // Normalize transfer number to E.164. Skip tool if number can't be normalized.
    const normalizedTransfer = normalizePhone(transferNumber);
    if (normalizedTransfer) {
        tools.push({
            type: "transfer_call",
            name: "transfer_call",
            transfer_destination: {
                type: "predefined",
                number: normalizedTransfer, // Must be verified in Retell Dashboard identity first
            },
            transfer_option: {
                type: "cold_transfer",
            },
            description: "Transfiere la llamada a una persona física humana si el cliente lo solicita expresamente (\"quiero hablar con un humano\" / \"pásame con alguien\") o si hay problemas técnicos sistemáticos que no puedes resolver."
        });
    }

    const llm = await retell.llm.create({
        model: "gpt-4o",
        general_prompt: systemPrompt,
        starting_state: "gestionar_cita",
        states: [
            {
                name: "gestionar_cita",
                state_prompt:
                    "Cuando el cliente quiera agendar, modificar o cancelar una cita, recopila la información necesaria y usa las funciones disponibles. Si pide hablar con una persona, transfiere la llamada.",
                tools: tools,
            },
        ],
    } as any);

    return llm.llm_id;
}

export async function updateRetellAgent(
    agentId: string,
    config: Partial<AgentConfig>
): Promise<void> {
    console.log(`[Retell] Evaluando actualización para el agente ${agentId}`);

    // Obtenemos el agente para ver su llm_id
    const agent = (await retell.agent.retrieve(agentId)) as any;
    const llmId = agent.response_engine.llm_id;

    const fullConfig: AgentConfig = {
        clientId: config.clientId!,
        businessName: config.businessName || agent.agent_name?.split(' — ')[0] || "Negocio",
        agentName: config.agentName || agent.agent_name?.split(' — ')[1] || "Asistente",
        tone: config.tone || "profesional",
        voice: config.voice || "male",
        services: config.services || [],
        schedules: config.schedules || [],
        staff: config.staff || [],
        webhookUrl: config.webhookUrl || process.env.NEXT_PUBLIC_APP_URL!,
        transferPhone: config.transferPhone
    };

    if (!llmId) {
        throw new Error(`No se encontró LLM ID para el agente ${agentId}`);
    }

    const systemPrompt = generateSystemPrompt(fullConfig);

    // For development, we prefer the provided webhookUrl if it's not localhost.
    let baseUrl = fullConfig.webhookUrl;
    if (fullConfig.webhookUrl.includes("localhost")) {
        baseUrl = process.env.RETELL_WEBHOOK_URL || "https://www.citaliks.com";
    }

    const tools: any[] = [
        {
            type: "custom" as const,
            name: "check_availability",
            description: "Consulta los huecos libres en la agenda. Es MUY IMPORTANTE incluir el service_name para que la duración de la cita sea correcta.",
            url: `${baseUrl}/api/retell/function-call?name=check_availability`,
            method: "POST" as const,
            timeout_ms: 10000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    date: { type: "string" as const, description: "Fecha en formato YYYY-MM-DD" },
                    service_name: { type: "string" as const, description: "Nombre del servicio solicitado" },
                    staff_name: { type: "string" as const, description: "Nombre del profesional específico solicitado (opcional)" },
                },
                required: ["date"],
            },
        },
        {
            type: "custom" as const,
            name: "book_appointment",
            description: "Crea una cita en la agenda. Asegúrate de incluir el service_name exacto que el cliente solicitó.",
            url: `${baseUrl}/api/retell/function-call?name=book_appointment`,
            method: "POST" as const,
            timeout_ms: 10000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    caller_name: { type: "string" as const, description: "Nombre del cliente que llama" },
                    service_name: { type: "string" as const, description: "Servicio a reservar" },
                    date: { type: "string" as const, description: "Fecha en formato YYYY-MM-DD" },
                    time: { type: "string" as const, description: "Hora en formato HH:MM" },
                    staff_name: { type: "string" as const, description: "Nombre del profesional con quien reserva (opcional)" },
                    notes: { type: "string" as const, description: "Notas adicionales opcionales" },
                    caller_phone: { type: "string" as const, description: "Número de teléfono alternativo si el cliente quiere usar uno diferente al detectado automáticamente" },
                },
                required: ["caller_name", "service_name", "date", "time"],
            },
        },
        {
            type: "custom" as const,
            name: "cancel_appointment",
            description: "Cancela una cita existente. Puedes buscar por nombre del cliente, por teléfono, o por ambos. Si el cliente no recuerda su nombre, pídele el número de teléfono con el que reservó.",
            url: `${baseUrl}/api/retell/function-call?name=cancel_appointment`,
            method: "POST" as const,
            timeout_ms: 10000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    caller_name: { type: "string" as const, description: "Nombre del cliente (opcional si se proporciona teléfono)" },
                    caller_phone: { type: "string" as const, description: "Teléfono con el que se hizo la reserva (alternativa al nombre)" },
                    date: { type: "string" as const, description: "Fecha de la cita a cancelar (YYYY-MM-DD, opcional para acotar la búsqueda)" },
                    time: { type: "string" as const, description: "Hora de la cita a cancelar (HH:MM, opcional)" },
                },
                required: [],
            },
        },
        {
            type: "custom" as const,
            name: "reschedule_appointment",
            description: "Mueve una cita existente a una nueva fecha y hora. Usa esto cuando el cliente quiera cambiar su cita, no cuando quiera cancelarla definitivamente.",
            url: `${baseUrl}/api/retell/function-call?name=reschedule_appointment`,
            method: "POST" as const,
            timeout_ms: 15000,
            parameters: {
                type: "object" as const,
                properties: {
                    client_id: { type: "string" as const, description: "ID del cliente/negocio" },
                    caller_name: { type: "string" as const, description: "Nombre del cliente cuya cita se mueve" },
                    caller_phone: { type: "string" as const, description: "Teléfono del cliente (alternativa al nombre)" },
                    old_date: { type: "string" as const, description: "Fecha YYYY-MM-DD de la cita ACTUAL que quiere cambiar" },
                    new_date: { type: "string" as const, description: "Nueva fecha YYYY-MM-DD" },
                    new_time: { type: "string" as const, description: "Nueva hora HH:MM" },
                    service_name: { type: "string" as const, description: "Nombre del servicio (mismo que la cita original)" },
                },
                required: ["new_date", "new_time"],
            },
        },
    ];

    // Normalize transfer number to E.164. Skip tool if number can't be normalized.
    const normalizedTransferFull = normalizePhone(fullConfig.transferPhone);
    if (normalizedTransferFull) {
        tools.push({
            type: "transfer_call",
            name: "transfer_call",
            transfer_destination: {
                type: "predefined",
                number: normalizedTransferFull, // Must be verified in Retell Dashboard identity first
            },
            transfer_option: {
                type: "cold_transfer",
            },
            description: "Transfiere la llamada a una persona física humana si el cliente lo solicita expresamente (\"quiero hablar con un humano\" / \"pásame con alguien\") o si hay problemas técnicos sistemáticos que no puedes resolver."
        });
    }

    // Update LLM with new prompt and tools
    await retell.llm.update(llmId, {
        model: "gpt-4o",
        general_prompt: systemPrompt,
        states: [
            {
                name: "gestionar_cita",
                state_prompt: "Cuando el cliente quiera agendar, modificar o cancelar una cita, recopila la información necesaria y usa las funciones disponibles. Si pide hablar con una persona, transfiere la llamada.",
                tools: tools,
            },
        ],
    } as any);

    const voicePref = fullConfig.voice || "male";
    const voiceConfig = VOICE_MAPPING[voicePref] || VOICE_MAPPING["male"];

    const agentOptionsUpdate: any = {
        agent_name: `${fullConfig.businessName} — ${fullConfig.agentName}`,
        voice_id: voiceConfig.id,
        voice_speed: 1.0,
        voice_temperature: 0.7,
        responsiveness: 0.9,
        interruption_sensitivity: 0.8,
        backchannel_frequency: 0.7,
        backchannel_words: ["Claro", "Entendido", "Perfecto", "Sí", "Ajá"],
        ambient_sound: "call-center",
        normalize_for_speech: true,
        end_call_after_silence_ms: 20000,
    };

    if (voiceConfig.model) {
        agentOptionsUpdate.voice_model = voiceConfig.model;
    } else {
        // Enforce removal of the model explicit property if the voice doesn't use it, 
        // though Retell SDK might ignore it if passed to null.
        agentOptionsUpdate.voice_model = null; // or simply omitted
    }

    // Actualizar también la voz y configuración de audio del agente
    await retell.agent.update(agentId, agentOptionsUpdate);

    console.log(`[Retell] Agente ${agentId} (LLM ${llmId}) actualizado con éxito.`);
}

export async function deleteRetellAgent(agentId: string): Promise<void> {
    await retell.agent.delete(agentId);
}

/**
 * Vincula un número de teléfono (Netelip/SIP) a un agente de Retell.
 * El número debe estar en formato E.164 (ej: +34910053385).
 * Retell permite importar números SIP externos como "phone numbers" y asignarlos a un agente.
 */
export async function linkPhoneNumberToAgent(
    agentId: string,
    phoneNumber: string,
    clientId: string
): Promise<{ success: boolean; phoneNumberId?: string; error?: string }> {
    try {
        // Normalize to E.164
        const normalized = normalizePhone(phoneNumber) ?? (phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`);

        // Step 1: Find if the number already exists in Retell's inventory
        let phoneObj: any = null;
        try {
            const existingNumbers = await (retell as any).phoneNumber.list();
            if (Array.isArray(existingNumbers)) {
                phoneObj = existingNumbers.find((p: any) =>
                    p.phone_number === normalized ||
                    p.phone_number === phoneNumber
                );
            }
        } catch (listErr) {
            console.warn("[Retell] Could not list phone numbers:", (listErr as any)?.message);
        }

        if (!phoneObj) {
            // Number is not yet in Retell — cannot auto-link.
            // Admin must first add the number in the Retell dashboard manually.
            console.warn(`[Retell] Phone ${normalized} not found in Retell inventory. Number saved in DB only.`);
            return {
                success: false,
                error: `El número ${normalized} no está en el inventario de Retell. Añádelo primero en el panel de Retell → Phone Numbers antes de vincularlo.`
            };
        }

        // Step 2: Assign the number to the agent and set dynamic variables
        await (retell as any).phoneNumber.update(phoneObj.phone_number_id || phoneObj.id, {
            inbound_agent_id: agentId,
            retell_llm_dynamic_variables: {
                client_id: clientId,
            }
        });

        console.log(`[Retell] Número ${normalized} vinculado al agente ${agentId}`);
        return { success: true, phoneNumberId: phoneObj.phone_number_id || phoneObj.id };
    } catch (err: any) {
        console.error("[Retell] Error vinculando número:", err?.message || err);
        return { success: false, error: err?.message || "Error desconocido" };
    }
}

