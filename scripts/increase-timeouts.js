require('dotenv').config({ path: '.env.local' });
const Retell = require('retell-sdk');
const r = new Retell({ apiKey: process.env.RETELL_API_KEY });

async function updateTimeouts() {
    try {
        const agent = await r.agent.retrieve('agent_0b57229b14ce99e87505e1a635');
        const llmId = agent.response_engine.llm_id;
        const llm = await r.llm.retrieve(llmId);

        const state = llm.states[0];
        console.log('Current tools:');
        state.tools.forEach(t => {
            if (t.type === 'custom') {
                console.log(`  ${t.name}: timeout=${t.timeout_ms}ms, required=${JSON.stringify(t.parameters?.required)}`);
                // Increase all timeouts to 20 seconds
                t.timeout_ms = 20000;
            }
        });

        console.log('\nUpdating timeouts to 20000ms...');
        await r.llm.update(llmId, { states: [state] });
        console.log('Done!');
    } catch (e) {
        console.error("Error:", e);
    }
}
updateTimeouts();
