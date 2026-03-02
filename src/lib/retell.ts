import Retell from "retell-sdk";

export const retell = new Retell({
    apiKey: process.env.RETELL_API_KEY!,
});

export interface AgentConfig {
    clientId: string;
    businessName: string;
    agentName: string;
    tone: string;
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
    // PLANTILLA BASE DE CONVERSACIÓN — igual para todos los clientes de CITALIKS
    // =========================================================================
    return `Eres ${agentName}, la recepción telefónica de ${businessName}.
${toneDesc}

## SALUDO INICIAL OBLIGATORIO
CUANDO EMPIECE LA LLAMADA, di SIEMPRE esta frase (adaptando el nombre del negocio):
"¡Hola! Gracias por llamar a ${businessName}. ¿En qué te ayudo hoy?"

Nunca empieces la llamada de otra forma. Esta frase es fija e inamovible.

## Personalidad y forma de hablar (¡MUY IMPORTANTE PARA SONAR HUMANA!)
Eres una recepcionista real. Habla exactamente como lo haría una persona experta al teléfono en España:
- **PROHIBIDO REPETIR MULETILLAS:** Nunca digas todo el rato "Perfecto", "De acuerdo" o "Entendido" en cada frase. Usa silencios, o responde directamente. En lugar de decir "Perfecto, ¿quieres reservar?", di simplemente "Claro, ¿qué día te viene bien?".
- **PROHIBIDO MONÓLOGOS:** Di un máximo de 2 frases cortas y suéltale el turno al cliente.
- **NO DELETREES LA AGENDA:** Si preguntas por fecha y hora, no leas la agenda entera. Si te piden un día, diles SOLO las dos primeras opciones que salgan: "El lunes por la mañana tengo a las 10 o a las 11:30, ¿te encaja alguna o prefieres por la tarde?".
- **PROHIBIDO DECIR HORAS EXACTAS CON MINUTOS EXTRAÑOS:** Trata de ser natural. 
- Habla SIEMPRE en español de España. Cero palabras en inglés.
- Si vas a mirar la agenda, di: "Déjame mirar la agenda..." y lanza la función inmediatamente. No esperes a que el cliente te dé permiso.
- **ESCUCHA ACTIVA:** Presta atención al contexto. Si el usuario duda ("ehhh", "pues..."), estate en silencio hasta que termine.

## Contexto temporal
Hoy es ${dateStr} y son las ${timeStr} (hora peninsular española).
Usa el día de HOY como referencia para interpretar fechas relativas.
Mucha atención:
- "Hoy" = ${dateStr}.
- "Mañana" = el día siguiente exacto.
- "El próximo [día de la semana]" o "Este [día de la semana]". Calcula la fecha exacta comparando con hoy ANTES de buscar. NUNCA busques una cita en fechas que ya han pasado. ¡Prohibido buscar "el lunes" si hoy es martes y te refieres a la semana pasada! Asume siempre que hablan de días FUTUROS.

## Servicios disponibles (uso INTERNO — no los leas todos)
${servicesTxt}

## Profesionales del equipo
${staffTxt}
Si hay más de un profesional y el cliente no especifica, asigna uno tú sin preguntar para simplificar.

## Horario Comercial
${scheduleTxt}

## Flujo para agendar una cita
1. Si el cliente quiere reservar, necesitas saber: qué quiere hacerse, y cuándo.
2. Si te da el QUÉ y el CUÁNDO de forma natural (ej: "quiero cortarme el pelo el jueves"), asume la duración que tienes en memoria, calcula la FECHA EXACTA del próximo jueves y llama a \`check_availability\`.
3. Ofrece los huecos dando a elegir de forma natural ("Tengo hueco a las 10:00 o ya por la tarde a las 17:30, ¿cuál prefieres?").
4. NOTA: NUNCA intentes agendar o consultar fechas que estén en el PASADO.
5. Cuando el cliente diga una hora, pregunta a qué nombre la dejas (si no lo sabes).
6. Llama a \`book_appointment\` directamente.
7. Al confirmar, di: "Genial [nombre], ya te he apuntado para [día] a las [hora]. El teléfono de tu reserva termina en [3 últimos dígitos de caller_phone, invéntate que es el que me da la centralita si pregunta]. Te mandaremos un SMS para confirmarte. ¿Te puedo ayudar con algo más?"

## Regla de seguridad en cancelaciones
Solo puedes cancelar la cita si tienes su nombre / teléfono y el día exacto de la cita. 

## Formato del teléfono
Al mencionar un número de teléfono, SIEMPRE usa grupos de 3, ej: "677 146 735". No digas "seis setenta y siete...". 
Lo más profesional es no dictarle todo el número de vuelta para ganar tiempo, solo dí los últimos 3 dígitos.

client_id: ${config.clientId}
Responde SIEMPRE en español de España.`;
}

export async function createRetellAgent(config: AgentConfig): Promise<string> {
    const systemPrompt = generateSystemPrompt(config);

    try {
        const llmId = await createRetellLLM(systemPrompt, config.clientId, config.webhookUrl, config.transferPhone);

        const agent = await retell.agent.create({
            agent_name: `${config.businessName} — ${config.agentName}`,
            response_engine: {
                type: "retell-llm",
                llm_id: llmId,
            },
            voice_id: "custom_voice_630a60422ba640c56991af203d",
            language: "es-ES",
            voice_speed: 0.95,
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
        } as any);


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
        baseUrl = process.env.RETELL_WEBHOOK_URL || "https://api.citaliks.com";
    }

    const tools: any[] = [
        {
            type: "custom" as const,
            name: "check_availability",
            description: "Consulta los huecos libres en la agenda",
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
                required: ["client_id", "date"],
            },
        },
        {
            type: "custom" as const,
            name: "book_appointment",
            description: "Crea una cita en la agenda",
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
                required: ["client_id", "caller_name", "service_name", "date", "time"],
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
                required: ["client_id"],
            },
        },
    ];

    if (transferNumber) {
        tools.push({
            type: "transfer_call",
            name: "transfer_call",
            transfer_option: {
                type: "cold_transfer",
                number: transferNumber,
            },
            description: "Transfiere la llamada a una persona si el cliente lo solicita o si hay problemas técnicos que no puedes resolver."
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
        baseUrl = process.env.RETELL_WEBHOOK_URL || "https://api.citaliks.com";
    }

    const tools: any[] = [
        {
            type: "custom" as const,
            name: "check_availability",
            description: "Consulta los huecos libres en la agenda",
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
                required: ["client_id", "date"],
            },
        },
        {
            type: "custom" as const,
            name: "book_appointment",
            description: "Crea una cita en la agenda",
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
                required: ["client_id", "caller_name", "service_name", "date", "time"],
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
                required: ["client_id"],
            },
        },
    ];

    if (fullConfig.transferPhone) {
        tools.push({
            type: "transfer_call",
            name: "transfer_call",
            transfer_option: {
                type: "cold_transfer",
                number: fullConfig.transferPhone,
            },
            description: "Transfiere la llamada a una persona si el cliente lo solicita o si hay problemas técnicos que no puedes resolver."
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

    // Actualizar también la voz y configuración de audio del agente
    await retell.agent.update(agentId, {
        voice_id: "custom_voice_630a60422ba640c56991af203d",
        voice_speed: 0.95,
        voice_temperature: 0.7,
        responsiveness: 0.9,
        interruption_sensitivity: 0.8,
        backchannel_frequency: 0.7,
        backchannel_words: ["Claro", "Entendido", "Perfecto", "Sí", "Ajá"],
        ambient_sound: "call-center",
        normalize_for_speech: true,
        end_call_after_silence_ms: 20000,
    } as any);

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
    phoneNumber: string
): Promise<{ success: boolean; phoneNumberId?: string; error?: string }> {
    try {
        // Normalizar el número a formato E.164
        const normalized = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber.replace(/^0+/, "")}`;

        // Intentar importar el número en Retell (si no existe ya)
        let phoneObj: any;
        try {
            // Buscar si el número ya está importado en Retell
            const existingNumbers = await (retell as any).phoneNumber.list();
            phoneObj = existingNumbers?.find((p: any) => p.phone_number === normalized);
        } catch {
            // Si no hay método list, continuamos
        }

        if (!phoneObj) {
            // Importar el número como número externo (SIP/Netelip)
            phoneObj = await (retell as any).phoneNumber.import({
                phone_number: normalized,
                termination_uri: `sip:${normalized.replace("+", "")}@sip.netelip.com`,
            });
        }

        // Asignar el número al agente
        await (retell as any).phoneNumber.update(phoneObj.phone_number_id || phoneObj.id, {
            inbound_agent_id: agentId,
        });

        console.log(`[Retell] Número ${normalized} vinculado al agente ${agentId}`);
        return { success: true, phoneNumberId: phoneObj.phone_number_id || phoneObj.id };
    } catch (err: any) {
        console.error("[Retell] Error vinculando número:", err?.message || err);
        // No lanzamos error — guardamos el número en BD aunque Retell falle
        return { success: false, error: err?.message || "Error desconocido" };
    }
}
