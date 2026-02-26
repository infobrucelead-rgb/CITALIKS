
const { PrismaClient } = require('@prisma/client');
const { updateRetellAgent } = require('./src/lib/retell');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Syncing bot with new URL:', process.env.NEXT_PUBLIC_APP_URL);

        const clients = await prisma.client.findMany({
            where: { retellAgentId: { not: null } },
            include: { services: true, schedules: true, staff: true }
        });

        for (const client of clients) {
            console.log(`Updating agent for client: ${client.businessName} (${client.id})`);
            await updateRetellAgent(client.retellAgentId, {
                clientId: client.id,
                businessName: client.businessName,
                agentName: client.agentName,
                tone: client.agentTone,
                services: client.services,
                schedules: client.schedules,
                staff: client.staff,
                webhookUrl: process.env.NEXT_PUBLIC_APP_URL,
                transferPhone: client.transferPhone
            });
            console.log('Successfully updated agent:', client.retellAgentId);
        }
    } catch (e) {
        console.error('Error syncing bot:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
