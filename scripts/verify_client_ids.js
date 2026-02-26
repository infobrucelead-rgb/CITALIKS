const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const clients = await prisma.client.findMany();
    console.log("Clients in DB:");
    clients.forEach(c => {
        console.log(`- ${c.businessName}: ID = ${c.id}`);
    });
}

run().catch(console.error).finally(() => prisma.$disconnect());
