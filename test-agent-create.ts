import { createRetellAgent } from "./src/lib/retell";
import { retell } from "./src/lib/retell";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
    try {
        console.log("Starting test...");
        const agentId = await createRetellAgent({
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

        await retell.agent.delete(agentId);
        console.log("Cleaned up mock agent.");
    } catch (e: any) {
        console.error("FAILED TO CREATE:", JSON.stringify(e, null, 2));
        if (e.message) console.error(e.message);
    }
}
run();
