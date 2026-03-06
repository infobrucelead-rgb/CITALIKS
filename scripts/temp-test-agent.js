const { createRetellAgent, deleteRetellAgent } = require("./src/lib/retell");
const dotenv = require("dotenv");

// Quick mock for testing
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });

// Need to import the ts file 
const { createRetellAgent: testAgent } = require("./src/lib/retell.ts");

dotenv.config({ path: ".env" });

async function run() {
    try {
        console.log("Starting test...");
        const agentId = await testAgent({
            clientId: "test-123",
            businessName: "Test",
            agentName: "Bot",
            tone: "profesional",
            services: [],
            schedules: [],
            staff: [],
            webhookUrl: "https://www.citaliks.com"
        });
        console.log("SUCCESS! Created agent:", agentId);

        // Clean up
        const { retell } = require("./src/lib/retell.ts");
        await retell.agent.delete(agentId);
        console.log("Cleaned up mock agent.");
    } catch (e) {
        console.error("FAILED TO CREATE:", JSON.stringify(e, null, 2));
        if (e.message) console.error(e.message);
    }
}
run();
