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
    staff: Array<{ id: string; name: string; googleCalendarId?: string | null }>;
    webhookUrl: string;
    transferPhone?: string | null;
}

function generateSystemPrompt(config: AgentConfig): string {
    const { businessName, agentName, tone, services, schedules, staff } = config;

    const toneDesc =
        tone === "cercano"
            ? "Habla de forma amigable y cercana, tutea al cliente."
            : "Habla de forma profesional y cortés, usa usted.";

    const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

    const scheduleTxt = (schedules || [])
        .filter((s) => s.isOpen)
        .map((s) => `- ${DAY_NAMES[s.dayOfWeek]}: ${s.openTime} a ${s.closeTime}`)
        .join("\n");

    const servicesTxt = (services || [])
        .map(
            (s) =>
                `- ${s.name} (${s.durationMin} min${s.price ? `, ${s.price}€` : ""})`
        )
        .join("\n");

    const staffTxt = (staff || [])
        .map((s) => `- ${s.name}`)
        .join("\n");

    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    return `Eres ${agentName}, el asistente telefónico de ${businessName}. ${toneDesc}

## Contexto Temporal
Hoy es ${dateStr} y son las ${timeStr}. Úsalo como referencia para las fechas que mencione el cliente (ej: "este viernes", "mañana").

## Tu función
Atender las llamadas de los clientes de ${businessName}. Puedes:
1. Consultar disponibilidad en la agenda
2. Crear citas para los clientes
3. Modificar o cancelar citas existentes
4. Transferir la llamada a una persona si el cliente lo pide o si no puedes resolver su consulta

## Profesionales disponibles (Staff)
Si el cliente pregunta por alguien específico o quiere reservar con un profesional concreto, usa los nombres de esta lista:
${staffTxt}

## Servicios disponibles
${servicesTxt}

## Horario de atención
${scheduleTxt}

## Reglas importantes
- Siempre confirma el nombre del cliente antes de agendar
- Si el cliente menciona un profesional específico (ej: "quiero con Jose"), úsalo en las llamadas a funciones.
- Al pedir una cita, pregunta qué servicio desea, para qué fecha y hora
- Si no hay disponibilidad, ofrece alternativas próximas
- Si el cliente quiere cancelar, pide confirmación antes de proceder
- Si no entiendes algo, pide amablemente que lo repita
- Si el cliente se pone difícil, pide hablar con un humano o si no puedes resolver su consulta, transfiérelo usando la herramienta disponible.

## Identificador del cliente
Tu client_id es: ${config.clientId}
Inclúyelo en todas las llamadas a funciones para que el sistema identifique de qué negocio se trata.

Responde siempre en español de España. Sé conciso y natural, como si fuera una llamada de teléfono real.`;
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
            voice_id: "openai-Alloy",
            language: "es-ES",
            voice_speed: 1.0,
            ambient_sound: "call-center",
            boosted_keywords: [config.businessName],
            normalize_for_speech: true,
            end_call_after_silence_ms: 10000,
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
            url: `${baseUrl}/api/retell/function-call`,
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
            url: `${baseUrl}/api/retell/function-call`,
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
            url: `${baseUrl}/api/retell/function-call`,
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
            number: transferNumber,
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
        businessName: config.businessName || agent.agent_name.split(' — ')[0],
        agentName: config.agentName || agent.agent_name.split(' — ')[1],
        tone: config.tone || "profesional",
        services: config.services || [],
        schedules: config.schedules || [],
        staff: config.staff || [],
        webhookUrl: config.webhookUrl || process.env.NEXT_PUBLIC_APP_URL!,
        transferPhone: config.transferPhone
    };

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
            url: `${baseUrl}/api/retell/function-call`,
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
            url: `${baseUrl}/api/retell/function-call`,
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
            url: `${baseUrl}/api/retell/function-call`,
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
            number: fullConfig.transferPhone,
            description: "Transfiere la llamada a una persona si el cliente lo solicita o si hay problemas técnicos que no puedes resolver."
        });
    }

    // Update LLM with new prompt and tools
    await retell.llm.update(llmId, {
        general_prompt: systemPrompt,
        states: [
            {
                name: "gestionar_cita",
                state_prompt: "Cuando el cliente quiera agendar, modificar o cancelar una cita, recopila la información necesaria y usa las funciones disponibles. Si pide hablar con una persona, transfiere la llamada.",
                tools: tools,
            },
        ],
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
