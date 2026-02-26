
const { PrismaClient } = require('@prisma/client');
const Retell = require('retell-sdk').default;
require('dotenv').config();

const prisma = new PrismaClient();
const retell = new Retell({
    apiKey: process.env.RETELL_API_KEY,
});

async function main() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.RETELL_WEBHOOK_URL;
        console.log('Syncing bot with new URL:', baseUrl);

        const clients = await prisma.client.findMany({
            where: { retellAgentId: { not: null } },
            include: { services: true, schedules: true, staff: true }
        });

        for (const client of clients) {
            console.log(`Updating agent for client: ${client.businessName} (AgentID: ${client.retellAgentId})`);

            // 1. Retrieve the agent to get the LLM ID
            const agent = await retell.agent.retrieve(client.retellAgentId);
            const llmId = agent.response_engine.llm_id;

            // 2. Define the tools with the new URL
            const tools = [
                {
                    type: "custom",
                    name: "check_availability",
                    description: "Consulta los huecos libres en la agenda",
                    url: `${baseUrl}/api/retell/function-call`,
                    method: "POST",
                    timeout_ms: 10000,
                    parameters: {
                        type: "object",
                        properties: {
                            client_id: { type: "string" },
                            date: { type: "string" },
                            service_name: { type: "string" },
                            staff_name: { type: "string" },
                        },
                        required: ["client_id", "date"],
                    },
                },
                {
                    type: "custom",
                    name: "book_appointment",
                    description: "Crea una cita en la agenda",
                    url: `${baseUrl}/api/retell/function-call`,
                    method: "POST",
                    timeout_ms: 10000,
                    parameters: {
                        type: "object",
                        properties: {
                            client_id: { type: "string" },
                            caller_name: { type: "string" },
                            service_name: { type: "string" },
                            date: { type: "string" },
                            time: { type: "string" },
                            staff_name: { type: "string" },
                            notes: { type: "string" },
                        },
                        required: ["client_id", "caller_name", "service_name", "date", "time"],
                    },
                },
                {
                    type: "custom",
                    name: "cancel_appointment",
                    description: "Cancela una cita existente",
                    url: `${baseUrl}/api/retell/function-call`,
                    method: "POST",
                    timeout_ms: 10000,
                    parameters: {
                        type: "object",
                        properties: {
                            client_id: { type: "string" },
                            caller_name: { type: "string" },
                            date: { type: "string" },
                            time: { type: "string" },
                        },
                        required: ["client_id", "caller_name", "date"],
                    },
                },
            ];

            if (client.transferPhone) {
                tools.push({
                    type: "transfer_call",
                    name: "transfer_call",
                    number: client.transferPhone,
                    description: "Transfiere la llamada si el cliente lo solicita o hay problemas técnicos."
                });
            }

            // 3. Update the LLM
            await retell.llm.update(llmId, {
                states: [
                    {
                        name: "gestionar_cita",
                        state_prompt: "Cuando el cliente quiera agendar, modificar o cancelar una cita, recopila la información necesaria y usa las funciones disponibles. Si pide hablar con una persona, transfiere la llamada.",
                        tools: tools,
                    },
                ],
            });

            console.log('Successfully updated LLM tools for agent:', client.retellAgentId);
        }
    } catch (e) {
        console.error('Error syncing bot:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
