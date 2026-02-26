const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log('--- DB Check ---');
    console.log('Prisma client models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
    console.log('Appointment model:', prisma.appointment ? 'EXISTS' : 'MISSING');
}

run().catch(console.error).finally(() => prisma.$disconnect());
