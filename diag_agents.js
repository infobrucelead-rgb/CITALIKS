
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const clients = await prisma.client.findMany();
        console.log('=== CLIENTS ===');
        clients.forEach(c => {
            console.log(`- ID: ${c.id}`);
            console.log(`  Business: ${c.businessName}`);
            console.log(`  AgentID: ${c.retellAgentId}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
