const Retell = require('retell-sdk');
const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";
const retell = new Retell({ apiKey: RETELL_API_KEY });

async function run() {
    const agents = [
        { name: "Bicis Pablosky", id: "agent_3dcc2bf369e3caf1b43e254537" },
        { name: "CitaLiks", id: "agent_0b57229b14ce99e87505e1a635" }
    ];

    for (const a of agents) {
        console.log(`\n--- AGENT: ${a.name} (${a.id}) ---`);
        const agent = await retell.agent.retrieve(a.id);
        const llmId = agent.response_engine.llm_id;
        const llm = await retell.llm.retrieve(llmId);
        
        const tools = llm.states[0].tools;
        tools.forEach(t => {
            console.log(`Tool: ${t.name} -> URL: ${t.url}`);
        });
    }
}

run().catch(console.error);
