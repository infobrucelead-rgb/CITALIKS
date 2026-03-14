const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const RETELL_API_KEY = process.env.RETELL_API_KEY || "key_cc895057c5755f73e2dcf27c7119";

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.retellai.com',
            port: 443,
            path: path,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${RETELL_API_KEY}` }
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
    console.log("Iniciando backup de configuración de Retell...");
    const clients = await prisma.client.findMany({
        where: { retellAgentId: { not: null } }
    });

    const backup = [];

    for (const client of clients) {
        console.log(`Backing up client: ${client.businessName} (${client.retellAgentId})`);
        const agentRes = await getRequest(`/get-agent/${client.retellAgentId}`);
        if (agentRes.status === 200) {
            const agentData = JSON.parse(agentRes.body);
            const llmId = agentData.response_engine.llm_id;
            const llmRes = await getRequest(`/get-retell-llm/${llmId}`);
            
            backup.push({
                clientId: client.id,
                businessName: client.businessName,
                agentId: client.retellAgentId,
                agentData: agentData,
                llmData: llmRes.status === 200 ? JSON.parse(llmRes.body) : null
            });
        }
    }

    const backupPath = path.join(__dirname, 'backup_retell_config.json');
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`Backup completado en: ${backupPath}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
