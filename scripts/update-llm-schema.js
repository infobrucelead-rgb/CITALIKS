require('dotenv').config({ path: '.env.local' });
const Retell = require('retell-sdk');
const r = new Retell({ apiKey: process.env.RETELL_API_KEY });

async function update() {
    try {
        const agent = await r.agent.retrieve('agent_0b57229b14ce99e87505e1a635');
        const llmId = agent.response_engine.llm_id;
        const llm = await r.llm.retrieve(llmId);

        const state = llm.states[0];
        state.tools.forEach(t => {
            if (t.parameters && t.parameters.required) {
                console.log(`Before (${t.name}):`, t.parameters.required);
                t.parameters.required = t.parameters.required.filter(req => req !== 'client_id');
                console.log(`After (${t.name}):`, t.parameters.required);
            }
        });

        await r.llm.update(llmId, {
            states: [state]
        });
        console.log("LLM tools updated successfully!");
    } catch (e) {
        console.error("Error updating LLM:", e);
    }
}
update();
