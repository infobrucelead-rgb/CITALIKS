import { updateRetellAgent } from "../src/lib/retell";
import { prisma } from "../src/lib/db";

async function run() {
    const clientId = "cmm0hcj6w000013wgcfyqalro";
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { services: true, schedules: true }
    });

    if (!client || !client.retellAgentId) {
        console.error("Client or agent not found");
        return;
    }

    console.log("Updating agent prompt for:", client.businessName);
    await updateRetellAgent(client.retellAgentId, {
        clientId: client.id,
        businessName: client.businessName || "Negocio",
        agentName: client.agentName || "Asistente",
        tone: client.agentTone || "profesional",
        services: client.services as any,
        schedules: client.schedules as any,
        webhookUrl: "https://api.citaliks.com" // Placeholder for dev
    });
    console.log("Agent updated successfully");
}

run().catch(console.error);
