const https = require('https');

const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";
const LLM_ID = "llm_22f10cb7a20741f2602aa7834a8f";
const TUNNEL_URL = "https://star-environmental-msie-inkjet.trycloudflare.com";
const CLIENT_ID = "cmm0hcj6w000013wgcfyqalro";

const tools = [
    {
        type: "custom",
        name: "check_availability",
        url: `${TUNNEL_URL}/api/retell/function-call`,
        description: "Consulta los huecos libres en la agenda para una fecha específica.",
        parameters: {
            type: "object",
            properties: {
                client_id: { type: "string" },
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
                client_id: { type: "string" },
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
                client_id: { type: "string" },
                caller_name: { type: "string" },
                date: { type: "string" },
                time: { type: "string" }
            },
            required: ["client_id", "caller_name", "date"]
        }
    }
];

const payload = {
    tools: [
        ...tools,
        {
            type: "transfer_call",
            name: "transfer_call",
            number: "+34614202364",
            description: "Transfiere la llamada a un humano si el bot no puede ayudar."
        }
    ],
    starting_state: "gestionar_cita", // Keep states to stay safe
    states: [
        {
            name: "gestionar_cita",
            state_prompt: `Tu client_id es: ${CLIENT_ID}. Úsalo siempre en tus llamadas a funciones.`,
            tools: tools
        }
    ]
};

const data = JSON.stringify(payload);

const options = {
    hostname: 'api.retellai.com',
    port: 443,
    path: `/update-retell-llm/${LLM_ID}`,
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${RETELL_API_KEY}`
    }
};

console.log("Retrying clean update with full diagnostics...");

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log("RESPONSE:", body);
    });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
