const Retell = require("retell-sdk");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const retell = new Retell({
    apiKey: process.env.RETELL_API_KEY,
});

async function debugAgent() {
    try {
        const agentId = process.argv[2];
        if (!agentId) {
            console.error("Uso: node debug-agent.js <agentId>");
            process.exit(1);
        }

        console.log(`Buscando agente ${agentId}...`);
        const agent = await retell.agent.retrieve(agentId);
        console.log("Configuración del Agente:");
        console.log(JSON.stringify(agent, null, 2));

        if (agent.response_engine && agent.response_engine.llm_id) {
            console.log(`\nBuscando LLM ${agent.response_engine.llm_id}...`);
            const llm = await retell.llm.retrieve(agent.response_engine.llm_id);
            console.log("Configuración del LLM:");
            console.log(JSON.stringify(llm, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

debugAgent();
