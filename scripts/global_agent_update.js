const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";
const TUNNEL_URL = "https://star-environmental-msie-inkjet.trycloudflare.com";

async function makeRequest(path, method, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'api.retellai.com',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': `Bearer ${RETELL_API_KEY}`
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.retellai.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${RETELL_API_KEY}`
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    const clients = await prisma.client.findMany();

    for (const client of clients) {
        if (!client.retellAgentId) continue;

        console.log(`\n--- PROCESING CLIENT: ${client.businessName} ---`);
        console.log(`Agent ID: ${client.retellAgentId}`);

        // Update Webhook
        console.log("Updating Webhook URL...");
        await makeRequest(`/update-agent/${client.retellAgentId}`, 'PATCH', {
            webhook_url: `${TUNNEL_URL}/api/retell/webhook`
        });

        // Get LLM ID
        const agentRes = await getRequest(`/get-agent/${client.retellAgentId}`);
        const agentData = JSON.parse(agentRes.body);
        const llmId = agentData.response_engine.llm_id;
        console.log(`LLM ID: ${llmId}`);

        // Update LLM
        const tools = [
            {
                type: "custom",
                name: "check_availability",
                url: `${TUNNEL_URL}/api/retell/function-call`,
                description: "Consulta los huecos libres en la agenda para una fecha específica.",
                parameters: {
                    type: "object",
                    properties: {
                        client_id: { type: "string", default: client.id },
                        date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
                        service_name: { type: "string" },
                        staff_name: { type: "string" }
                    },
                    required: ["client_id", "date"]
                }
            },
            {
                type: "custom",
                name: "book_appointment",
                url: `${TUNNEL_URL}/api/retell/function-call`,
                description: "Reserva una cita en la agenda.",
                parameters: {
                    type: "object",
                    properties: {
                        client_id: { type: "string", default: client.id },
                        caller_name: { type: "string" },
                        service_name: { type: "string" },
                        date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
                        time: { type: "string", description: "Hora en formato HH:MM" },
                        staff_name: { type: "string" },
                        notes: { type: "string" }
                    },
                    required: ["client_id", "caller_name", "service_name", "date", "time"]
                }
            },
            {
                type: "custom",
                name: "cancel_appointment",
                url: `${TUNNEL_URL}/api/retell/function-call`,
                description: "Cancela una cita existente.",
                parameters: {
                    type: "object",
                    properties: {
                        client_id: { type: "string", default: client.id },
                        caller_name: { type: "string" },
                        date: { type: "string" },
                        time: { type: "string" }
                    },
                    required: ["client_id", "caller_name", "date"]
                }
            }
        ];

        console.log("Updating LLM Tools & States...");
        const llmUpdate = await makeRequest(`/update-retell-llm/${llmId}`, 'PATCH', {
            tools: [
                ...tools,
                {
                    type: "transfer_call",
                    name: "transfer_call",
                    number: client.transferPhone || "+34600000000",
                    description: "Transfiere la llamada a un humano."
                }
            ],
            states: [
                {
                    name: "gestionar_cita",
                    state_prompt: `Tu client_id es: ${client.id}. Úsalo siempre en tus llamadas a funciones.`,
                    tools: tools
                }
            ]
        });
        console.log("LLM Status:", llmUpdate.status);
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
