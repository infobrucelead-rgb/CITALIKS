import { PrismaClient } from '@prisma/client';
import Retell from 'retell-sdk';

const prisma = new PrismaClient();
const retell = new Retell({ apiKey: "key_cc895057c5755f73e2dcf27c7119" });

async function run() {
    console.log("Iniciando sincronización FORZADA de agentes...");
    const clients = await prisma.client.findMany({
        where: { retellAgentId: { not: null } }
    });

    const baseUrl = "https://www.citaliks.com";

    for (const client of clients) {
        try {
            console.log(`\n--- Procesando: ${client.businessName} (${client.retellAgentId}) ---`);
            
            const agent = await retell.agent.retrieve(client.retellAgentId!);
            const llmId = agent.response_engine.llm_id;
            
            console.log(`LLM ID: ${llmId}`);

            const tools = [
                {
                    type: "custom",
                    name: "check_availability",
                    url: `${baseUrl}/api/retell/function-call?name=check_availability`,
                    method: "POST",
                    timeout_ms: 10000,
                    description: "Consulta los huecos libres en la agenda.",
                    parameters: {
                        type: "object",
                        properties: {
                            date: { type: "string", description: "Fecha YYYY-MM-DD" },
                            service_name: { type: "string" }
                        },
                        required: ["date"]
                    }
                },
                {
                    type: "custom",
                    name: "book_appointment",
                    url: `${baseUrl}/api/retell/function-call?name=book_appointment`,
                    method: "POST",
                    timeout_ms: 10000,
                    description: "Reserva una cita.",
                    parameters: {
                        type: "object",
                        properties: {
                            caller_name: { type: "string" },
                            service_name: { type: "string" },
                            date: { type: "string" },
                            time: { type: "string" }
                        },
                        required: ["caller_name", "service_name", "date", "time"]
                    }
                },
                {
                    type: "custom",
                    name: "cancel_appointment",
                    url: `${baseUrl}/api/retell/function-call?name=cancel_appointment`,
                    method: "POST",
                    timeout_ms: 10000,
                    description: "Cancela una cita.",
                    parameters: {
                        type: "object",
                        properties: {
                            caller_phone: { type: "string" }
                        }
                    }
                },
                {
                    type: "custom",
                    name: "reschedule_appointment",
                    url: `${baseUrl}/api/retell/function-call?name=reschedule_appointment`,
                    method: "POST",
                    timeout_ms: 15000,
                    description: "Cambia la fecha de una cita.",
                    parameters: {
                        type: "object",
                        properties: {
                            new_date: { type: "string" },
                            new_time: { type: "string" }
                        },
                        required: ["new_date", "new_time"]
                    }
                }
            ];

            await retell.llm.update(llmId, {
                states: [
                    {
                        name: "gestionar_cita",
                        state_prompt: "Gestiona citas de forma profesional.",
                        tools: tools
                    }
                ]
            } as any);

            console.log(`✅ Agente ${client.retellAgentId} actualizado con URLs limpias.`);
        } catch (err) {
            console.error(`❌ Error en ${client.businessName}:`, err.message);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
