const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
const prisma = new PrismaClient();
async function main() {
    try {
        const clients = await prisma.client.findMany();
        console.log('=== CLIENTS ===');
        clients.forEach(c => {
            console.log(`- ID: ${c.id}`);
            console.log(`  Email: ${c.email}`);
            console.log(`  Business: ${c.businessName}`);
            console.log(`  Agent ID: ${c.retellAgentId}`);
            console.log(`  Phone: ${c.phone}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
