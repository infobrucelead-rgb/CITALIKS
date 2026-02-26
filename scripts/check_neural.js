const https = require('https');

const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";
const AGENT_ID = "agent_6e79da54d1d3f3e5b71fbd524e"; // Neural 360 agent

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
    const agent = await getRequest(`/get-agent/${AGENT_ID}`);
    console.log(agent.body);
}

run().catch(console.error);
