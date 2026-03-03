require('dotenv').config({ path: '.env.local' });
const Retell = require('retell-sdk');
const r = new Retell({ apiKey: process.env.RETELL_API_KEY });

const PROD_URL = 'https://www.citaliks.com';

async function switchToProd() {
    try {
        const agent = await r.agent.retrieve('agent_0b57229b14ce99e87505e1a635');
        const llmId = agent.response_engine.llm_id;
        const llm = await r.llm.retrieve(llmId);
        const state = llm.states[0];

        console.log('Updating tool URLs to production...');
        state.tools.forEach(t => {
            if (t.url) {
                const toolName = t.url.split('name=')[1];
                const newUrl = `${PROD_URL}/api/retell/function-call?name=${toolName}`;
                console.log(`  ${t.name}: ${t.url} → ${newUrl}`);
                t.url = newUrl;
            }
        });

        await r.llm.update(llmId, { states: [state] });
        console.log('✓ Tool URLs updated');

        await r.agent.update('agent_0b57229b14ce99e87505e1a635', {
            webhook_url: `${PROD_URL}/api/retell/webhook`
        });
        console.log('✓ Webhook URL updated to:', PROD_URL + '/api/retell/webhook');
        console.log('\nDone! Retell now points to production server.');
    } catch (e) {
        console.error("Error:", e.message || e);
    }
}
switchToProd();
