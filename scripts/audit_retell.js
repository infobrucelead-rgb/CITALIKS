const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";

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

        console.log(`\n=== CLIENT: ${client.businessName} ===`);
        console.log(`Agent ID: ${client.retellAgentId}`);

        const agentRes = await getRequest(`/get-agent/${client.retellAgentId}`);
        if (agentRes.status !== 200) {
            console.log(`Error getting agent: ${agentRes.status}`);
            continue;
        }
        const agentData = JSON.parse(agentRes.body);
        console.log(`Agent Webhook: ${agentData.webhook_url}`);

        const llmId = agentData.response_engine.llm_id;
        console.log(`LLM ID: ${llmId}`);

        const llmRes = await getRequest(`/get-retell-llm/${llmId}`);
        if (llmRes.status !== 200) {
            console.log(`Error getting LLM: ${llmRes.status}`);
            continue;
        }
        const llmData = JSON.parse(llmRes.body);

        console.log("Global Tools:");
        (llmData.tools || []).forEach(t => {
            console.log(` - ${t.name}: ${t.url || 'internal'}`);
        });

        console.log("States:");
        (llmData.states || []).forEach(s => {
            console.log(` State: ${s.name}`);
            (s.tools || []).forEach(t => {
                console.log(`  - ${t.name}: ${t.url || 'internal'}`);
            });
        });
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
