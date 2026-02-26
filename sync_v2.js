
const Retell = require('retell-sdk').default;
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
    return acc;
}, {});

const retell = new Retell({
    apiKey: env.RETELL_API_KEY,
});

async function main() {
    const agentId = 'agent_6e79da54d1d3f3e5b71fbd524e'; // NEURAL 360
    console.log(`--- SYNCING AGENT ${agentId} ---`);

    const agent = await retell.agent.retrieve(agentId);
    const llmId = agent.response_engine.llm_id;
    const llm = await retell.llm.retrieve(llmId);

    const today = new Date();
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const todayStr = `${days[today.getDay()]}, ${today.getDate()} de ${today.toLocaleString('es-ES', { month: 'long' })} de ${today.getFullYear()}`;
    const timeStr = today.toTimeString().slice(0, 5);

    console.log(`Setting reference date to: ${todayStr} ${timeStr}`);

    let newPrompt = llm.general_prompt.replace(/Hoy es .*\./, `Hoy es ${todayStr} y son las ${timeStr}.`);

    // Ensure the prompt includes explicit instructions for the simplified tool response
    if (!newPrompt.includes("available_slots")) {
        newPrompt += "\n\nIMPORTANTE: Cuando consultes disponibilidad, recibirás una lista de huecos en 'available_slots'. Menciona los primeros 3 o 4 al cliente de forma natural.";
    }

    console.log('Updating LLM...');
    await retell.llm.update(llmId, {
        general_prompt: newPrompt
    });

    console.log('✅ LLM Updated and Published');
}

main().catch(console.error);
