
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const clients = await prisma.client.findMany();
        console.log('=== CLIENTS ===');
        clients.forEach(c => {
            console.log(`- ID: ${c.id}`);
            console.log(`  Email: ${c.email}`);
            console.log(`  Role: ${c.role}`);
            console.log(`  Business: ${c.businessName}`);
            console.log(`  DB URL: ${c.databaseUrl ? 'YES' : 'NO'}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
