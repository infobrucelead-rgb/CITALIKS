import { PrismaClient } from '@prisma/client';
import { updateRetellAgent } from '../src/lib/retell';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all clients...");
    const clients = await prisma.client.findMany({
        where: { isActive: true, retellAgentId: { not: null } }
    });

    for (const client of clients) {
        if (!client.retellAgentId) continue;
        console.log(`Updating agent for client ${client.businessName} (${client.id})...`);
        try {
            await updateRetellAgent(client.retellAgentId, client as any);
            console.log("Success!");
        } catch (e: any) {
            console.error("Failed:", e.response?.data || e.message);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
