
const { PrismaClient } = require('@prisma/client');
const Retell = require('retell-sdk').default;
const fs = require('fs');

// Manual .env parsing
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
const retell = new Retell({
    apiKey: env.RETELL_API_KEY,
});

async function main() {
    try {
        const baseUrl = env.NEXT_PUBLIC_APP_URL;
        console.log('Syncing bot with new URL:', baseUrl);

        const agentIds = [
            'agent_382b39efb9d9f7ee8dbaca4e66',
            'agent_6e79da54d1d3f3e5b71fbd524e'
        ];

        for (const agentId of agentIds) {
            console.log(`Updating agent tools for: ${agentId}`);

            const agent = await retell.agent.retrieve(agentId);
            const llmId = agent.response_engine.llm_id;

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

            // Add transfer tool if needed - for now let's just update the custom ones
            // Retrieve current tools to preserve transfer_call if it exists
            const llm = await retell.llm.retrieve(llmId);
            const currentTools = llm.states[0].tools;
            const transferTool = currentTools.find(t => t.type === 'transfer_call');
            if (transferTool) {
                tools.push(transferTool);
            }

            await retell.llm.update(llmId, {
                states: [
                    {
                        name: "gestionar_cita",
                        state_prompt: "Cuando el cliente quiera agendar, modificar o cancelar una cita, recopila la información necesaria y usa las funciones disponibles. Si pide hablar con una persona, transfiere la llamada.",
                        tools: tools,
                    },
                ],
            });

            console.log(`Successfully updated agent: ${agentId}`);
        }
    } catch (e) {
        console.error('Error syncing bot:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
