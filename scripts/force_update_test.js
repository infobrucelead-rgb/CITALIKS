const Retell = require('retell-sdk');
const RETELL_API_KEY = "key_cc895057c5755f73e2dcf27c7119";
const retell = new Retell({ apiKey: RETELL_API_KEY });

async function run() {
    const agentId = "agent_3dcc2bf369e3caf1b43e254537"; // Bicis Pablosky
    const agent = await retell.agent.retrieve(agentId);
    const llmId = agent.response_engine.llm_id;

    console.log(`Forcing update for LLM: ${llmId}`);

    const tools = [
        {
            type: "custom",
            name: "check_availability",
            url: "https://www.citaliks.com/api/retell/function-call?name=check_availability",
            method: "POST",
            timeout_ms: 10000,
            description: "Consulta los huecos libres en la agenda.",
            parameters: {
                type: "object",
                properties: {
                    date: { type: "string" }
                },
                required: ["date"]
            }
        }
    ];

    await retell.llm.update(llmId, {
        general_prompt: "Eres una recepcionista profesional.",
        states: [
            {
                name: "gestionar_cita",
                state_prompt: "Ayuda al cliente con su cita.",
                tools: tools
            }
        ]
    });

    console.log("Update sent. Verifying...");
    const updatedLlm = await retell.llm.retrieve(llmId);
    console.log("Updated Tool URL:", updatedLlm.states[0].tools[0].url);
}

run().catch(console.error);
