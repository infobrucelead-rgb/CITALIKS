const Retell = require('retell-sdk');
const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";
const retell = new Retell({ apiKey: RETELL_API_KEY });

async function run() {
    const agentId = "agent_3dcc2bf369e3caf1b43e254537"; // Bicis Pablosky
    const agent = await retell.agent.retrieve(agentId);
    console.log("Agent:", JSON.stringify(agent, null, 2));
    
    const llmId = agent.response_engine.llm_id;
    const llm = await retell.llm.retrieve(llmId);
    console.log("LLM:", JSON.stringify(llm, null, 2));
}

run().catch(console.error);
