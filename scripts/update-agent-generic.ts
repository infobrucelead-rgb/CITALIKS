import { updateRetellAgent } from "../src/lib/retell";
import { prisma } from "../src/lib/db";

async function run(clientId: string) {
    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { services: true, schedules: true, staff: true }
    });

    if (!client || !client.retellAgentId) {
        console.error(`Client ${clientId} or agent not found`);
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
        staff: client.staff as any,
        webhookUrl: process.env.NEXT_PUBLIC_APP_URL || "https://www.citaliks.com",
        transferPhone: client.transferPhone
    });
    console.log(`Agent ${client.retellAgentId} updated successfully`);
}

const targetClientId = process.argv[2];
if (!targetClientId) {
    console.error("Please provide a clientId");
    process.exit(1);
}

run(targetClientId).catch(console.error);
